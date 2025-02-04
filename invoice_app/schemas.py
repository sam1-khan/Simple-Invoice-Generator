from ninja import Schema
from datetime import datetime
from typing import List, Optional

# ---------- Authentication Schema ----------
class LoginSchema(Schema):
    email: str
    password: str

# ---------- InvoiceOwner Schemas ----------
class InvoiceOwnerCreate(Schema):
    email: str
    name: str
    address: str
    phone: str
    ntn_number: str
    bank: str
    account_title: str
    iban: str
    password: str
    phone_2: Optional[str] = None
    logo: Optional[str] = None        # Assuming string paths/URLs for images
    signature: Optional[str] = None

class InvoiceOwnerUpdate(Schema):
    email: Optional[str] = None
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    phone_2: Optional[str] = None
    ntn_number: Optional[str] = None
    bank: Optional[str] = None
    account_title: Optional[str] = None
    iban: Optional[str] = None
    logo: Optional[str] = None
    signature: Optional[str] = None

class InvoiceOwnerOut(Schema):
    id: int
    email: str
    name: str
    address: str
    phone: str
    phone_2: Optional[str] = None
    ntn_number: str
    bank: str
    account_title: str
    iban: str
    logo: Optional[str] = None
    signature: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# ---------- Client Schemas ----------
class ClientCreate(Schema):
    name: str
    address: Optional[str] = None
    ntn_number: Optional[str] = None
    phone: Optional[str] = None

class ClientUpdate(Schema):
    name: Optional[str] = None
    address: Optional[str] = None
    ntn_number: Optional[str] = None
    phone: Optional[str] = None

class ClientOut(Schema):
    id: int
    name: str
    address: Optional[str] = None
    ntn_number: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# ---------- Invoice Schemas ----------
class InvoiceCreate(Schema):
    client_id: int
    tax_percentage: Optional[float] = None
    date: Optional[str] = None           # Date string (ISO format) or adjust to a date type if needed
    notes: Optional[str] = None
    is_taxed: Optional[bool] = False
    is_quotation: Optional[bool] = False
    transit_charges: Optional[float] = None

class InvoiceUpdate(Schema):
    client_id: Optional[int] = None
    tax_percentage: Optional[float] = None
    date: Optional[str] = None
    notes: Optional[str] = None
    is_taxed: Optional[bool] = None
    is_quotation: Optional[bool] = None
    transit_charges: Optional[float] = None

class InvoiceOut(Schema):
    id: int
    invoice_owner: InvoiceOwnerOut
    client: ClientOut
    reference_number: str
    tax_percentage: Optional[float] = None
    total_price: float
    tax: float
    grand_total: float
    date: Optional[str] = None
    notes: Optional[str] = None
    is_taxed: bool
    is_quotation: bool
    transit_charges: Optional[float] = None
    created_at: datetime
    updated_at: datetime

# ---------- InvoiceItem Schemas ----------
class InvoiceItemCreate(Schema):
    name: str
    unit: str
    description: Optional[str] = None
    quantity: float
    unit_price: float

class InvoiceItemUpdate(Schema):
    name: Optional[str] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None

class InvoiceItemOut(Schema):
    id: int
    invoice_id: int
    name: str
    unit: str
    description: Optional[str] = None
    quantity: float
    unit_price: float
    total_price: float
