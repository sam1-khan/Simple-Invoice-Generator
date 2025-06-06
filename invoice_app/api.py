from ninja import File, NinjaAPI, UploadedFile
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.views.decorators.cache import cache_page
from django_ratelimit.decorators import ratelimit
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_str, force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from typing import List, Optional
from ninja.security import django_auth
from ninja.pagination import paginate
from ninja.responses import Response
from django_ratelimit.exceptions import Ratelimited
from .models import InvoiceOwner, Client, Invoice, InvoiceItem
from .schemas import (
    LoginSchema,
    InvoiceOwnerCreate,
    InvoiceOwnerUpdate,
    InvoiceOwnerOut,
    ClientCreate,
    ClientUpdate,
    ClientOut,
    InvoiceCreate,
    InvoiceUpdate,
    InvoiceOut,
    InvoiceItemCreate,
    InvoiceItemUpdate,
    InvoiceItemOut,
    ResetPasswordSchema,
    ForgotPasswordRequestSchema,
    ErrorSchema,
    SuccessSchema,
)

api = NinjaAPI(title="Invoice Generator API", version="1.0.0", auth=django_auth)

# -----------------------------------------------
# Helper functions to serialize date fields to ISO strings
# -----------------------------------------------
def serialize_invoice_owner(owner):
    return {
        "id": owner.id,
        "email": owner.email,
        "name": owner.name,
        "address": owner.address,
        "phone": owner.phone,
        "phone_2": owner.phone_2,
        "ntn_number": owner.ntn_number,
        "bank": owner.bank,
        "account_title": owner.account_title,
        "iban": owner.iban,
        "logo": owner.logo.url if owner.logo else None,
        "signature": owner.signature.url if owner.signature else None,
        "is_onboarded": owner.is_onboarded,
        "created_at": owner.created_at.isoformat(),
        "updated_at": owner.updated_at.isoformat(),
        "is_staff": owner.is_staff,
    }

def serialize_client(client):
    return {
        "id": client.id,
        "invoice_owner": serialize_invoice_owner(client.invoice_owner),
        "name": client.name,
        "address": client.address,
        "ntn_number": client.ntn_number,
        "phone": client.phone,
        "created_at": client.created_at.isoformat(),
        "updated_at": client.updated_at.isoformat(),
    }

def serialize_invoice(invoice):
    return {
        "id": invoice.id,
        "client": serialize_client(invoice.client),
        "reference_number": invoice.reference_number,
        "tax_percentage": invoice.tax_percentage,
        "total_price": invoice.total_price,
        "tax": invoice.tax,
        "grand_total": invoice.grand_total,
        "date": invoice.date.isoformat() if invoice.date else None,
        "notes": invoice.notes,
        "is_paid": invoice.is_paid,
        "is_taxed": invoice.is_taxed,
        "is_quotation": invoice.is_quotation,
        "transit_charges": invoice.transit_charges,
        "created_at": invoice.created_at.isoformat(),
        "updated_at": invoice.updated_at.isoformat(),
    }

# -------------------------
# Authentication & Rate Limiting
# -------------------------

@api.exception_handler(Ratelimited)
def handle_ratelimit_exception(request, exc: Ratelimited):
    return Response({"detail": "Rate limit exceeded. Please try again later."}, status=429)

@api.post("/auth/register/", response={201: InvoiceOwnerOut, 400: ErrorSchema}, auth=None)
@ratelimit(key="ip", rate="100/m", block=True)
def register_invoice_owner(request, payload: InvoiceOwnerCreate):
    if InvoiceOwner.objects.filter(email=payload.email).exists():
        return 400, {"detail": "Email is already in use"}
    if payload.password != payload.confirm_password:
        return 400, {"detail": "Passwords do not match."}
    try:
        validate_password(payload.password)
    except ValidationError as e:
        return 400, {"detail": e.messages}
    user_data = payload.dict(exclude={"password", "confirm_password"})
    user = InvoiceOwner(**user_data)
    user.set_password(payload.password)
    try:
        user.full_clean()
    except ValidationError as e:
        return 400, {"detail": e.messages}
    user.save()
    return 201, user

@api.post("/auth/login/", response={200: dict, 401: dict}, auth=None)
@ratelimit(key="ip", rate="100/m", block=True)
def login(request, payload: LoginSchema):
    user = authenticate(request, email=payload.email, password=payload.password)
    if user:
        django_login(request, user)
        response_data = {"detail": "Successfully logged in."}
        response = api.create_response(request, response_data, status=200)
        # Set a client-readable auth flag (non-HttpOnly)
        response.set_cookie(
            "auth_ready",
            "true",
            secure=not settings.DEBUG,
            samesite='None',
            httponly=False,
            max_age=30 * 24 * 60 * 60  # 30 days
        )
        return response
    return 401, {"detail": "Invalid credentials"}

@api.post("/auth/logout/", response={200: dict}, auth=django_auth)
def logout(request):
    django_logout(request)
    response = api.create_response(request, {"detail": "Sucessfully Logged out"}, status=200)
    response.delete_cookie("auth_ready")
    return response

@api.get("auth/current-user/", response=InvoiceOwnerOut, auth=django_auth)
def current_user(request):
    return request.user

# -------------------------
# InvoiceOwner Endpoints
# -------------------------

@cache_page(60 * 5)
@paginate
@api.get("/invoice-owners/", response={200: List[InvoiceOwnerOut], 403: ErrorSchema, 500: ErrorSchema}, auth=django_auth)
def list_invoice_owners(request):
    if request.user.is_staff:
        return InvoiceOwner.objects.all()
    return InvoiceOwner.objects.filter(id=request.user.id)

@api.get("/invoice-owners/{id}/", response={200: InvoiceOwnerOut, 403: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema}, auth=django_auth)
def get_invoice_owner(request, id: int):
    if not request.user.is_staff and id != request.user.id:
        return 403, {"detail": "You do not have permission to view this user."}
    return get_object_or_404(InvoiceOwner, id=id)

@api.patch("/invoice-owners/{id}/", response={200: InvoiceOwnerOut, 400: ErrorSchema, 403: ErrorSchema, 404: ErrorSchema, 422: ErrorSchema, 500: ErrorSchema}, auth=django_auth)
def partial_update_invoice_owner(request, payload: InvoiceOwnerUpdate, id: int):
    if not request.user.is_staff and id != request.user.id:
        return 403, {"detail": "You do not have permission to update this user."}

    user = get_object_or_404(InvoiceOwner, id=id)

    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(user, attr, value)

    try:
        user.full_clean()
    except ValidationError as e:
        return 400, {"detail": e.messages}

    user.save()
    return 200, user
@ratelimit(key="ip", rate="100/m", block=True)
@api.post(
    "/invoice-owners/{id}/upload-files/",
    response={
        200: InvoiceOwnerOut,
        400: ErrorSchema,
        403: ErrorSchema,
        404: ErrorSchema,
        422: ErrorSchema,
        500: ErrorSchema,
    },
    auth=django_auth,
)
def upload_files(
    request,
    id: int,
    logo: Optional[UploadedFile] = File(None),
    signature: Optional[UploadedFile] = File(None),
):
    if not request.user.is_staff and id != request.user.id:
        return 403, {"detail": "You do not have permission to update this user."}

    user = get_object_or_404(InvoiceOwner, id=id)

    if not user.is_onboarded:
        if not logo or not signature:
            return 400, {"detail": "Both logo and signature are required for onboarding."}

    if logo:
        user.logo = logo
    if signature:
        user.signature = signature

    try:
        user.full_clean()
        user.save()
    except ValidationError as e:
        return 400, {"detail": e.messages}

    return 200, user

@api.delete("/invoice-owners/{id}/", response={204: None, 403: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema}, auth=django_auth)
def delete_invoice_owner(request, id: int):
    if not request.user.is_staff and id != request.user.id:
        return 403, {"detail": "You do not have permission to delete this user."}
    user = get_object_or_404(InvoiceOwner, id=id)
    user.delete()
    return 204, None

# -------------------------
# Client Endpoints
# -------------------------

@cache_page(60 * 5)
@paginate
@api.get("/clients/", response={200: List[ClientOut], 403: ErrorSchema, 500: ErrorSchema}, auth=django_auth)
def list_clients(request):
    if request.user.is_staff:
        return Client.objects.all()
    return Client.objects.filter(invoice_owner=request.user)

@api.post("/clients/", response={201: ClientOut, 400: ErrorSchema, 403: ErrorSchema, 500: ErrorSchema}, auth=django_auth)
def create_client(request, payload: ClientCreate):
    client = Client(invoice_owner=request.user, **payload.dict())
    try:
        client.full_clean()
    except ValidationError as e:
        return 400, {"detail": e.messages}
    client.save()
    return 201, client

@api.get("/clients/{id}/", response={200: ClientOut, 403: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema}, auth=django_auth)
def get_client(request, id: int):
    if request.user.is_staff:
        return get_object_or_404(Client, id=id)
    return get_object_or_404(Client, id=id, invoice_owner=request.user)

@api.patch("/clients/{id}/", response={200: ClientOut, 400: ErrorSchema, 403: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema}, auth=django_auth)
def partial_update_client(request, id: int, payload: ClientUpdate):
    if request.user.is_staff:
        client = get_object_or_404(Client, id=id)
    else:
        client = get_object_or_404(Client, id=id, invoice_owner=request.user)
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(client, attr, value)
    try:
        client.full_clean()
    except ValidationError as e:
        return 400, {"detail": e.messages}
    client.save()
    return client

@api.delete("/clients/{id}/", response={204: None, 403: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema}, auth=django_auth)
def delete_client(request, id: int):
    if request.user.is_staff:
        client = get_object_or_404(Client, id=id)
    else:
        client = get_object_or_404(Client, id=id, invoice_owner=request.user)
    client.delete()
    return 204, None

# -------------------------
# Invoice Endpoints
# -------------------------

@cache_page(60 * 5)
@paginate
@api.get("/invoices/", response={200: List[InvoiceOut], 403: ErrorSchema, 500: ErrorSchema}, auth=django_auth)
def list_invoices(request):
    if request.user.is_staff:
        invoices = Invoice.objects.all().order_by('-updated_at')
    else:
        invoices = Invoice.objects.filter(client__invoice_owner=request.user).order_by('-updated_at')
    serialized = [serialize_invoice(inv) for inv in invoices]
    return serialized

@api.post("/invoices/", response={201: InvoiceOut, 400: ErrorSchema, 403: ErrorSchema, 500: ErrorSchema}, auth=django_auth)
def create_invoice(request, payload: InvoiceCreate):
    # Fetch the client object
    try:
        if request.user.is_staff:
            client = Client.objects.get(id=payload.client_id)
        else:
            client = Client.objects.get(id=payload.client_id, invoice_owner=request.user)
    except Client.DoesNotExist:
        return 400, {"detail": "Client not found or you do not have permission to access this client."}

    # Create the invoice
    invoice = Invoice(client=client, **payload.dict(exclude={"client_id"}))
    try:
        invoice.full_clean()
    except ValidationError as e:
        return 400, {"detail": e.messages}

    invoice.save()
    return 201, serialize_invoice(invoice)

@api.get("/invoices/{id}/", response={200: InvoiceOut, 403: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema}, auth=django_auth)
def get_invoice(request, id: int):
    if request.user.is_staff:
        invoice = get_object_or_404(Invoice, id=id)
    else:
        invoice = get_object_or_404(Invoice, id=id, client__invoice_owner=request.user)
    return serialize_invoice(invoice)

@api.patch("/invoices/{id}/", response={200: InvoiceOut, 400: ErrorSchema, 403: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema}, auth=django_auth)
def update_invoice(request, id: int, payload: InvoiceUpdate):
    if request.user.is_staff:
        invoice = get_object_or_404(Invoice, id=id)
    else:
        invoice = get_object_or_404(Invoice, id=id, client__invoice_owner=request.user)
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(invoice, attr, value)
    try:
        invoice.full_clean()
    except ValidationError as e:
        return 400, {"detail": e.messages}
    invoice.save()
    return serialize_invoice(invoice)

@api.delete("/invoices/{id}/", response={204: None, 403: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema}, auth=django_auth)
def delete_invoice(request, id: int):
    if request.user.is_staff:
        invoice = get_object_or_404(Invoice, id=id)
    else:
        invoice = get_object_or_404(Invoice, id=id, client__invoice_owner=request.user)
    invoice.delete()
    return 204, None

# -------------------------
# InvoiceItem Endpoints
# -------------------------

@cache_page(60 * 5)
@paginate
@api.get("/invoices/{invoice_id}/items/", response={200: List[InvoiceItemOut], 403: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema}, auth=django_auth)
def list_invoice_items(request, invoice_id: int):
    if request.user.is_staff:
        invoice = get_object_or_404(Invoice, id=invoice_id)
    else:
        invoice = get_object_or_404(Invoice, id=invoice_id, client__invoice_owner=request.user)
    return InvoiceItem.objects.filter(invoice=invoice)

@api.post("/invoices/{invoice_id}/items/", response={201: InvoiceItemOut, 400: ErrorSchema, 403: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema}, auth=django_auth)
def create_invoice_item(request, invoice_id: int, payload: InvoiceItemCreate):
    if request.user.is_staff:
        invoice = get_object_or_404(Invoice, id=invoice_id)
    else:
        invoice = get_object_or_404(Invoice, id=invoice_id, client__invoice_owner=request.user)
    item = InvoiceItem(invoice=invoice, **payload.dict())
    item.save()
    invoice.save()
    return 201, item

@api.get("/invoices/{invoice_id}/items/{id}/", response={200: InvoiceItemOut, 403: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema}, auth=django_auth)
def get_invoice_item(request, invoice_id: int, id: int):
    if request.user.is_staff:
        invoice = get_object_or_404(Invoice, id=invoice_id)
    else:
        invoice = get_object_or_404(Invoice, id=invoice_id, client__invoice_owner=request.user)
    return get_object_or_404(InvoiceItem, id=id, invoice=invoice)

@api.patch("/invoices/{invoice_id}/items/{id}/", response={200: InvoiceItemOut, 400: ErrorSchema, 403: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema}, auth=django_auth)
def update_invoice_item(request, invoice_id: int, id: int, payload: InvoiceItemUpdate):
    if request.user.is_staff:
        invoice = get_object_or_404(Invoice, id=invoice_id)
    else:
        invoice = get_object_or_404(Invoice, id=invoice_id, client__invoice_owner=request.user)
    item = get_object_or_404(InvoiceItem, id=id, invoice=invoice)
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(item, attr, value)
    item.save()
    invoice.save()
    return item

@api.delete("/invoices/{invoice_id}/items/{id}/", response={204: None, 403: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema}, auth=django_auth)
def delete_invoice_item(request, invoice_id: int, id: int):
    if request.user.is_staff:
        invoice = get_object_or_404(Invoice, id=invoice_id)
    else:
        invoice = get_object_or_404(Invoice, id=invoice_id, client__invoice_owner=request.user)
    item = get_object_or_404(InvoiceItem, id=id, invoice=invoice)
    item.delete()
    invoice.save()
    return 204, None

# -------------------------
# Forgot Password Flow (public endpoints)
# -------------------------

@api.post("/auth/forgot-password/", auth=None)
@ratelimit(key="ip", rate="5/m", block=True)
def request_password_reset(request, payload: ForgotPasswordRequestSchema):
    email = payload.email.lower().strip()
    try:
        user = InvoiceOwner.objects.get(email=email)
        reset_link = (
            f"{settings.FRONTEND_URL}/reset-password/"
            f"{urlsafe_base64_encode(force_bytes(user.pk))}/"
            f"{default_token_generator.make_token(user)}"
        )
        context = {"reset_link": reset_link, "user": user}
        html_message = render_to_string("emails/password_reset_email.html", context)
        plain_message = strip_tags(html_message)
        user.email_user(subject="Password Reset Request", message=plain_message, html_message=html_message)
    except InvoiceOwner.DoesNotExist:
        pass
    return 200, {"detail": "If the email exists, a password reset link has been sent."}

@api.post("/auth/reset-password/", response={400: ErrorSchema, 422: ErrorSchema, 200: SuccessSchema}, auth=None)
@ratelimit(key="ip", rate="5/m", block=True)
def reset_password(request, payload: ResetPasswordSchema):
    try:
        user_id = force_str(urlsafe_base64_decode(payload.uidb64))
        user = InvoiceOwner.objects.get(id=user_id)
    except (InvoiceOwner.DoesNotExist, ValueError, TypeError):
        return 400, {"detail": "Invalid or expired token."}
    if not default_token_generator.check_token(user, payload.token):
        return 400, {"detail": "Invalid or expired token."}
    if payload.new_password != payload.confirm_password:
        return 400, {"detail": "Passwords do not match."}
    try:
        validate_password(payload.new_password, user)
    except ValidationError as e:
        return 400, {"detail": e.messages}
    user.set_password(payload.new_password)
    user.save()

    try:
        context = {"user": user, "settings": settings}
        html_message = render_to_string("emails/password_reset_successful.html", context)
        plain_message = strip_tags(html_message)
        user.email_user(subject="Password Reset Successfully", message=plain_message, html_message=html_message)
    except Exception:
        pass
    return 200, {"detail": "Password has been reset successfully."}