from django.urls import path
from .views import (
    InvoiceListView,
    InvoiceDetailView,
    InvoiceCreateView,
    InvoiceUpdateView,
    InvoiceDeleteView,
    InvoicePDFView,
)

app_name='invoice_app'
urlpatterns = [
    path("", InvoiceListView.as_view(), name="invoice-list"),
    path("<int:pk>/", InvoiceDetailView.as_view(), name="invoice-detail"),
    path("create/", InvoiceCreateView.as_view(), name="invoice-create"),
    path("<int:pk>/update/", InvoiceUpdateView.as_view(), name="invoice-update"),
    path("<int:pk>/delete/", InvoiceDeleteView.as_view(), name="invoice-delete"),
    path('invoice/<int:pk>/pdf/', InvoicePDFView.as_view(), name='invoice-pdf'),
]
