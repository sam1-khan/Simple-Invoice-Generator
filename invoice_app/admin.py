from django.contrib import admin
from .models import Company, Client, Invoice
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'ntn_number')
    search_fields = ('name', 'ntn_number')
    list_filter = ('ntn_number',)
    ordering = ('name',)
    actions = ['verify_ntn']

    def verify_ntn(self, request, queryset):
        for company in queryset:
            if company.ntn_number:
                self.message_user(request, _("NTN is valid."), level='success')
            else:
                self.message_user(request, _("NTN is missing."), level='error')
    verify_ntn.short_description = _("Verify NTN Number")

    def save_model(self, request, obj, form, change):
        try:
            obj.clean()
        except ValidationError as e:
            self.message_user(request, str(e), level='error')
            return
        super().save_model(request, obj, form, change)


class ClientAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone')
    search_fields = ('name',)

    def save_model(self, request, obj, form, change):
        try:
            obj.clean()
        except ValidationError as e:
            self.message_user(request, str(e), level='error')
            return
        super().save_model(request, obj, form, change)


class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('reference_number', 'company', 'client', 'description', 'quantity', 'unit_price', 'total_price', 'grand_total')
    search_fields = ('description', 'reference_number', 'client__name')
    list_filter = ('created_at', 'client')
    ordering = ('-created_at', '-updated_at')
    readonly_fields = ('total_price', 'grand_total', 'created_at', 'updated_at', 'reference_number')

    def save_model(self, request, obj, form, change):
        try:
            obj.clean()  
        except ValidationError as e:
            self.message_user(request, str(e), level='error')
            return
        super().save_model(request, obj, form, change)


admin.site.register(Company, CompanyAdmin)
admin.site.register(Client, ClientAdmin)
admin.site.register(Invoice, InvoiceAdmin)
