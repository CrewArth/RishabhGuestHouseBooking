# Reports Module - Feature Specification

## Overview

Implement a new **Reports** feature as a separate module within the application. This should be treated as an independent feature with its own backend and frontend structure.

The Reports module allows:

- **Super Admin** to manage report access for Admins.
- **Admin** to generate PDF reports based on their assigned permissions.

Use **PDFKit** for PDF generation and **MongoDB Aggregation Pipelines** for fetching report data.

---

# Technology Stack

- **PDF Library:** PDFKit
- **Database:** MongoDB
- **Querying:** MongoDB Aggregation Pipeline
- **Architecture:** Modular and scalable

---

# Module Structure

Create a new feature folder.

```
reports/
│
├── controllers/
├── routes/
├── services/
├── repositories/
├── aggregations/
│   ├── bookingByGuestHouse.js
│   └── ...
├── pdf/
│   ├── templates/
│   ├── pdfGenerator.js
│   └── helpers.js
├── validations/
├── constants/
├── middleware/
└── utils/
```

The architecture should make it easy to add new reports in the future by simply adding:

- Aggregation pipeline
- Report configuration
- PDF template
- Route registration

---

# Sidebar

Add a new sidebar menu item:

- Reports

Visible to:

- Super Admin
- Admin

---

# Super Admin Features

The Super Admin can manage report permissions for every Admin.

## UI

1. Select an Admin.
2. Display all available reports.
3. Multi-select report access.
4. Save permissions.

Example:

```
Admin

☑ Booking by Guest House
☐ Booking Summary
☑ Room Occupancy
☐ Revenue Report

[Save]
```

Only the selected reports should be available to that Admin.

---

# Admin Features

Admins should only see reports assigned to them.

Workflow:

1. Open Reports.
2. View allowed reports.
3. Select a report.
4. Apply filters.
5. Click Generate.
6. Download/View PDF.

Backend APIs must also validate permissions. Do **not** rely only on frontend validation.

---

# Report Filters

The filtering system should be reusable because every report may have different filters.

Possible filters include:

- From Date
- To Date
- Guest House
- Room
- Booking Status
- Customer
- Payment Status
- Booking Source
- Custom filters (report-specific)

Each report should define its own supported filters.

---

# Backend

Use **MongoDB Aggregation Pipelines** for all report data.

Each report should have its own aggregation file.

Example:

```
aggregations/
    bookingByGuestHouse.js
    bookingSummary.js
    occupancyReport.js
```

Keep aggregation logic isolated from controllers and services.

---

# First Report

## Booking by Guest House

### Report Name

Booking by Guest House

### Filters

- From Date
- To Date
- Guest House

### Logic

Return all bookings belonging to the selected Guest House within the selected date range.

The aggregation pipeline should return all required booking information.

Example fields:

- Booking Number
- Guest Name
- Room
- Check-in Date
- Check-out Date
- Number of Guests
- Booking Status
- Total Amount

Adjust the fields according to the existing schema.

---

# PDF Requirements

## Library

Use **PDFKit**.

## Paper Size

- A4
- Portrait

## Margins

Use consistent margins suitable for printing.

---

# PDF Layout

## Header

Centered at the top:

```
Guest House Name
```

- Bold
- Large font
- Center aligned

---

## Filters Section

Below the title.

Example:

```
Filters

From Date   : 01/01/2026
To Date     : 31/01/2026
Guest House : ABC Guest House
```

- Labels should be bold.
- Values should be normal text.

---

## Report Table

Display report data in a professional table.

Requirements:

- Bold column headers
- Proper spacing
- Borders
- Text alignment
- Auto page break
- Repeat table header on every page (if supported)
- Handle long text gracefully

Example:

| Booking No | Guest | Room | Check In | Check Out | Status |
|------------|-------|------|----------|-----------|--------|

---

## Footer

Below the table:

```
Created By:
<Admin Name>
```

Bottom-right corner of every page:

```
Generated On:
<Current Date & Time>
```

---

# Permission Flow

## Super Admin

- Create/Edit report permissions.
- Assign reports to Admins.

## Admin

- Can only see assigned reports.
- Can only generate assigned reports.

Backend must verify permissions before generating any report.

---

# API Expectations

Example endpoints:

```
GET    /reports
GET    /reports/:reportName/filters
POST   /reports/:reportName/generate

GET    /report-permissions/:adminId
PUT    /report-permissions/:adminId
```

---

# Coding Guidelines

- Follow the existing project architecture.
- Write clean, modular code.
- Keep controllers lightweight.
- Move business logic into services.
- Keep aggregation logic separate.
- Separate PDF generation from data retrieval.
- Add proper validation.
- Implement proper error handling.
- Follow existing coding standards.
- Ensure the module is scalable and reusable.

---

# Future Reports

The architecture should allow adding new reports with minimal effort.

Adding a new report should only require:

1. Creating a new aggregation pipeline.
2. Creating a PDF template (if required).
3. Defining report filters.
4. Registering the report.
5. Assigning permissions via Super Admin.

No major changes should be required in the existing codebase.

---

# Acceptance Criteria

- Reports module exists as an independent feature.
- Sidebar contains a Reports menu for Admin and Super Admin.
- Super Admin can assign report permissions.
- Admin sees only permitted reports.
- Reports use MongoDB Aggregation Pipelines.
- Reports are generated using PDFKit.
- PDF format is A4 Portrait.
- Header, filters, table, and footer match the specified layout.
- Proper permission validation exists on the backend.
- Code is modular, reusable, maintainable, and easy to extend.