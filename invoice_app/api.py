from ninja import NinjaAPI
from ninja.pagination import paginate
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from django.views.decorators.cache import cache_page
from django_ratelimit.decorators import ratelimit
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.tokens import RefreshToken
from django.views.decorators.csrf import csrf_exempt
from typing import List

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
)

# Initialize API with JWT Auth
api = NinjaAPI(title="Invoice Generator API", version="1.0.0", auth=JWTAuth())

# -------------------------
# Authentication & Rate Limiting
# -------------------------
@api.post("/auth/register/", response={201: InvoiceOwnerOut}, auth=None)
@ratelimit(key='ip', rate='100/m', block=True)  # 100 requests/minute
def register_invoice_owner(request, payload: InvoiceOwnerCreate):
    if InvoiceOwner.objects.filter(email=payload.email).exists():
        return 400, {"detail": "Email is already in use"}
    
    # Create the InvoiceOwner user (password will be hashed)
    user = InvoiceOwner.objects.create(
        email=payload.email,
        name=payload.name,
        address=payload.address,
        phone=payload.phone,
        ntn_number=payload.ntn_number,
        bank=payload.bank,
        account_title=payload.account_title,
        iban=payload.iban,
        phone_2=payload.phone_2,
        logo=payload.logo,
        signature=payload.signature
    )
    user.set_password(payload.password)
    user.save()
    return 201, user

@api.post("/auth/login/", response={200: dict, 401: dict}, auth=None)
@ratelimit(key='ip', rate='100/m', block=True)
@csrf_exempt
def login(request, payload: LoginSchema):
    user = authenticate(request, email=payload.email, password=payload.password)
    if user:
        refresh = RefreshToken.for_user(user)
        return 200, {
            "access": str(refresh.access_token),
            "refresh": str(refresh)
        }
    return 401, {"detail": "Invalid credentials"}

# -------------------------
# InvoiceOwner Endpoints
# -------------------------
@cache_page(60 * 5)  # Must be the outermost decorator!
@paginate
@api.get("/invoice-owners/", response=List[InvoiceOwnerOut], auth=JWTAuth())
def list_invoice_owners(request):
    return InvoiceOwner.objects.all()


@api.get("/invoice-owners/{id}/", response=InvoiceOwnerOut, auth=JWTAuth())
def get_invoice_owner(request, id: int):
    return get_object_or_404(InvoiceOwner, id=id)

@api.patch("/invoice-owners/{id}/", response=InvoiceOwnerOut, auth=JWTAuth())
def partial_update_invoice_owner(request, id: int, payload: InvoiceOwnerUpdate):
    user = get_object_or_404(InvoiceOwner, id=id)
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(user, attr, value)
    user.save()
    return user

@api.delete("/invoice-owners/{id}/", response={204: None}, auth=JWTAuth())
def delete_invoice_owner(request, id: int):
    user = get_object_or_404(InvoiceOwner, id=id)
    user.delete()
    return 204, None

# -------------------------
# Client Endpoints
# -------------------------
@cache_page(60 * 5)
@paginate
@api.get("/clients/", response=List[ClientOut], auth=JWTAuth())
def list_clients(request):
    return Client.objects.all()

@api.post("/clients/", response={201: ClientOut}, auth=JWTAuth())
def create_client(request, payload: ClientCreate):
    client = Client.objects.create(**payload.dict())
    return 201, client

@api.get("/clients/{id}/", response=ClientOut, auth=JWTAuth())
def get_client(request, id: int):
    return get_object_or_404(Client, id=id)

@api.patch("/clients/{id}/", response=ClientOut, auth=JWTAuth())
def partial_update_client(request, id: int, payload: ClientUpdate):
    client = get_object_or_404(Client, id=id)
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(client, attr, value)
    client.save()
    return client

@api.delete("/clients/{id}/", response={204: None}, auth=JWTAuth())
def delete_client(request, id: int):
    client = get_object_or_404(Client, id=id)
    client.delete()
    return 204, None

# -------------------------
# Invoice Endpoints
# -------------------------
@cache_page(60 * 5)
@paginate
@api.get("/invoices/", response=List[InvoiceOut], auth=JWTAuth())
def list_invoices(request):
    return Invoice.objects.all()

@api.post("/invoices/", response={201: InvoiceOut}, auth=JWTAuth())
def create_invoice(request, payload: InvoiceCreate):
    # Set the current user as the invoice owner.
    invoice = Invoice.objects.create(
        invoice_owner=request.user,
        **payload.dict()
    )
    return 201, invoice

@api.get("/invoices/{id}/", response=InvoiceOut, auth=JWTAuth())
def get_invoice(request, id: int):
    return get_object_or_404(Invoice, id=id)

@api.patch("/invoices/{id}/", response=InvoiceOut, auth=JWTAuth())
def update_invoice(request, id: int, payload: InvoiceUpdate):
    invoice = get_object_or_404(Invoice, id=id)
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(invoice, attr, value)
    invoice.save()
    return invoice

@api.delete("/invoices/{id}/", response={204: None}, auth=JWTAuth())
def delete_invoice(request, id: int):
    invoice = get_object_or_404(Invoice, id=id)
    invoice.delete()
    return 204, None

# -------------------------
# InvoiceItem Endpoints
# -------------------------
@api.get("/invoices/{invoice_id}/items/", response=List[InvoiceItemOut], auth=JWTAuth())
def list_invoice_items(request, invoice_id: int):
    return InvoiceItem.objects.filter(invoice_id=invoice_id)

@api.post("/invoices/{invoice_id}/items/", response={201: InvoiceItemOut}, auth=JWTAuth())
def create_invoice_item(request, invoice_id: int, payload: InvoiceItemCreate):
    invoice = get_object_or_404(Invoice, id=invoice_id)
    item = InvoiceItem.objects.create(invoice=invoice, **payload.dict())
    return 201, item

@api.get("/invoices/{invoice_id}/items/{id}/", response=InvoiceItemOut, auth=JWTAuth())
def get_invoice_item(request, invoice_id: int, id: int):
    return get_object_or_404(InvoiceItem, id=id, invoice_id=invoice_id)

@api.patch("/invoices/{invoice_id}/items/{id}/", response=InvoiceItemOut, auth=JWTAuth())
def update_invoice_item(request, invoice_id: int, id: int, payload: InvoiceItemUpdate):
    item = get_object_or_404(InvoiceItem, id=id, invoice_id=invoice_id)
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(item, attr, value)
    item.save()
    return item

@api.delete("/invoices/{invoice_id}/items/{id}/", response={204: None}, auth=JWTAuth())
def delete_invoice_item(request, invoice_id: int, id: int):
    item = get_object_or_404(InvoiceItem, id=id, invoice_id=invoice_id)
    item.delete()
    return 204, None
