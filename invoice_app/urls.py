from django.urls import path
from .views import (
    InvoiceListView,
    InvoiceDetailView,
    InvoiceCreateView,
    InvoiceUpdateView,
    InvoiceDeleteView,
    InvoicePDFView,
    
    ClientListView,
    ClientDetailView,
    ClientCreateView,
    ClientUpdateView,
    ClientDeleteView,
)

app_name='invoice_app'
urlpatterns = [
    path("", InvoiceListView.as_view(), name="invoice-list"),
    path("<int:pk>/", InvoiceDetailView.as_view(), name="invoice-detail"),
    path("create/", InvoiceCreateView.as_view(), name="invoice-create"),
    path("<int:pk>/update/", InvoiceUpdateView.as_view(), name="invoice-update"),
    path("<int:pk>/delete/", InvoiceDeleteView.as_view(), name="invoice-delete"),
    path('invoice/<int:pk>/pdf/', InvoicePDFView.as_view(), name='invoice-pdf'),

    path("clients/", ClientListView.as_view(), name="client-list"),
    path("clients/<int:pk>/", ClientDetailView.as_view(), name="client-detail"),
    path("clients/create/", ClientCreateView.as_view(), name="client-create"),
    path("clients/<int:pk>/update/", ClientUpdateView.as_view(), name="client-update"),
    path("clients/<int:pk>/delete/", ClientDeleteView.as_view(), name="client-delete"),
]
