from django.http import HttpResponse
from django.shortcuts import get_object_or_404, render
from django.views import View
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from django.contrib.auth.mixins import LoginRequiredMixin
from .models import Invoice
from weasyprint import HTML
from django.template.loader import render_to_string
from .forms import InvoiceForm
from django.contrib.humanize.templatetags.humanize import naturaltime
from datetime import datetime
from django.db.models import Q


class InvoiceListView(LoginRequiredMixin, ListView):
    model = Invoice
    template_name = "invoice_app/list.html"
    context_object_name = "invoice"

    def parse_date(self, strval):
        """
        Tries to parse a date string in multiple formats. Returns a `datetime` object if successful,
        otherwise `None`.
        """
        valid_formats = [
            "%Y-%m-%d",  # Full date
            "%d-%b", "%d %b", "%d-%B", "%d %B",  # Day + month (short/long)
            "%d-%m", "%d %m",  # Day + numeric month
            "%d-%b-%y", "%d %b %y", "%d-%B-%y", "%d %B %y",  # Day + month + 2-digit year
            "%d-%b-%Y", "%d %b %Y", "%d-%B-%Y", "%d %B %Y",  # Day + month + 4-digit year
            "%d-%m-%y", "%d %m %y", "%d-%m-%Y", "%d %m %Y",  # Day + numeric month + year
        ]
        for fmt in valid_formats:
            try:
                date_obj = datetime.strptime(strval, fmt)
                # If year is missing, default to the current year
                if date_obj.year == 1900:
                    date_obj = date_obj.replace(year=datetime.now().year)
                return date_obj
            except ValueError:
                continue
        return None

    def build_query(self, strval):
        """
        Constructs a dynamic query based on the user's search input.
        """
        query = Q()

        # Numeric input (likely a day)
        if strval.isdigit():
            day = int(strval)
            if 1 <= day <= 31:  # Valid day
                query |= Q(created_at__day=day) | Q(updated_at__day=day)
            else:  # Non-date numeric input
                query |= Q(reference_number__icontains=strval) | \
                         Q(description__icontains=strval) | \
                         Q(client__name__icontains=strval)

        # Full date (YYYY-MM-DD)
        elif len(strval) == 10 and "-" in strval:
            try:
                date_obj = datetime.strptime(strval, "%Y-%m-%d")
                query |= Q(created_at__date=date_obj.date()) | Q(updated_at__date=date_obj.date())
            except ValueError:
                query |= Q(reference_number__icontains=strval) | \
                         Q(description__icontains=strval) | \
                         Q(client__name__icontains=strval)

        # Other date formats
        else:
            date_obj = self.parse_date(strval)
            if date_obj:
                query |= Q(created_at__date=date_obj.date()) | Q(updated_at__date=date_obj.date())
            else:
                # General text-based fallback search
                query |= Q(reference_number__icontains=strval) | \
                         Q(description__icontains=strval) | \
                         Q(client__name__icontains=strval)

        return query

    def get(self, request):
        strval = request.GET.get("search", "").strip()
        query = self.build_query(strval) if strval else Q()

        invoice_list = Invoice.objects.filter(query).select_related().distinct().order_by('-updated_at')

        for obj in invoice_list:
            obj.natural_updated = naturaltime(obj.updated_at)

        ctx = {'invoice_list': invoice_list, 'search': strval}
        return render(request, self.template_name, ctx)


class InvoiceDetailView(LoginRequiredMixin, DetailView):
    model = Invoice
    template_name = "invoice_app/detail.html"
    context_object_name = "invoice"


class InvoiceCreateView(LoginRequiredMixin, CreateView):
    model = Invoice
    form_class = InvoiceForm
    template_name = "invoice_app/form.html"
    success_url = reverse_lazy('invoice_app:invoice-list')

    def form_valid(self, form):
        # Any custom logic before saving
        return super().form_valid(form)


class InvoiceUpdateView(LoginRequiredMixin, UpdateView):
    model = Invoice
    form_class = InvoiceForm
    template_name = "invoice_app/form.html"
    success_url = reverse_lazy('invoice_app:invoice-list')

    def form_valid(self, form):
        # Any custom logic before updating
        return super().form_valid(form)


class InvoiceDeleteView(LoginRequiredMixin, DeleteView):
    model = Invoice
    template_name = "invoice_app/delete.html"
    success_url = reverse_lazy("invoice_app:invoice-list")


class InvoicePDFView(View):
    def get(self, request, pk, *args, **kwargs):
        invoice = get_object_or_404(Invoice, pk=pk)

        html_string = render_to_string('invoice_app/invoice_pdf.html', {'invoice': invoice})

        # Convert the HTML to a PDF using WeasyPrint
        html = HTML(string=html_string)
        pdf = html.write_pdf()

        # Return the generated PDF as an HttpResponse
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice_{invoice.pk}.pdf"'

        return response