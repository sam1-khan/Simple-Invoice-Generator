from django.contrib import admin
from .models import InvoiceOwner, Client, Invoice, InvoiceItem
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.admin import UserAdmin
from .forms import InvoiceOwnerCreationForm, InvoiceOwnerChangeForm


class InvoiceOwnerAdmin(UserAdmin):
    add_form = InvoiceOwnerCreationForm
    form = InvoiceOwnerChangeForm
    model = InvoiceOwner
    list_display = ('name', 'phone', 'phone_2', 'ntn_number', "email", "is_staff", 'updated_at',)
    search_fields = ('name', 'ntn_number', 'email',)
    list_filter = ("is_staff", "is_active", 'updated_at',)
    ordering = ('-updated_at',)
    date_hierarchy = 'updated_at'

    fieldsets = (
        (None, {"fields": ("email", "password", "name", "ntn_number", "phone", "phone_2", 'address', 'bank', 'iban', 'account_title', 'logo', 'signature',)}),
        ("Permissions", {"fields": ("is_staff", "is_active", "groups", "user_permissions")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "email", "password1", "password2", "name", "ntn_number", "phone", "phone_2", 'address', 'bank', 'iban', 'account_title', 'logo', 'signature',
                "is_staff", "is_active", "groups", "user_permissions",
            )}
        ),
    )

    def save_model(self, request, obj, form, change):
        try:
            obj.clean()
        except ValidationError as e:
            self.message_user(request, str(e), level='error')
            return
        super().save_model(request, obj, form, change)


class ClientAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'updated_at')
    search_fields = ('name',)
    list_filter = ('updated_at',)
    ordering = ('-created_at', '-updated_at')
    date_hierarchy = 'updated_at'

    def save_model(self, request, obj, form, change):
        try:
            obj.clean()
        except ValidationError as e:
            self.message_user(request, str(e), level='error')
            return
        super().save_model(request, obj, form, change)


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1
    readonly_fields = ('total_price',)


class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('reference_number', 'get_invoice_owner', 'get_client_name', 'total_price', 'grand_total', 'updated_at')
    search_fields = ('items', 'reference_number', 'client__name')
    list_filter = ('updated_at',)
    ordering = ('-updated_at',)
    date_hierarchy = 'updated_at'
    readonly_fields = ('total_price', 'tax', 'grand_total', 'created_at', 'updated_at', 'reference_number')

    inlines = [InvoiceItemInline,]

    def get_invoice_owner(self, obj):
        return obj.client.invoice_owner.name if obj.client and obj.client.invoice_owner else None
    
    get_invoice_owner.short_description = 'Invoice Owner'

    def get_client_name(self, obj):
        return obj.client.name  
    
    def save_model(self, request, obj, form, change):
        try:
            obj.clean()  
        except ValidationError as e:
            self.message_user(request, str(e), level='error')
            return
        super().save_model(request, obj, form, change)


class InvoiceItemAdmin(admin.ModelAdmin):
    list_display = ('invoice', 'name', 'description', 'quantity', 'unit_price', 'total_price')
    search_fields = ('name', 'description', 'invoice__reference_number')
    list_filter = ('invoice',)
    readonly_fields = ('total_price',)

    def save_model(self, request, obj, form, change):
        try:
            obj.clean()
        except ValidationError as e:
            self.message_user(request, str(e), level='error')
            return
        super().save_model(request, obj, form, change)


admin.site.register(InvoiceOwner, InvoiceOwnerAdmin)
admin.site.register(Client, ClientAdmin)
admin.site.register(Invoice, InvoiceAdmin)
admin.site.register(InvoiceItem, InvoiceItemAdmin)