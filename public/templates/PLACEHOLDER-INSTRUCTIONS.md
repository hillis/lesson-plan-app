# CTE Lesson Plan Template Placeholder Instructions

This document describes where to add `docx-templates` placeholders in the CTE lesson plan template (`cte-lesson-plan.docx`) for automated document generation.

## Placeholder Syntax

docx-templates uses the syntax `{= fieldName}` for inserting values into the template.

## Template Structure

The CTE template is an 18-row table with various merged cells and checkboxes.

## Placeholder Locations

### Header Section

| Location | Current Text | Replace With |
|----------|--------------|--------------|
| Row 2, Cell 1 | `Week:` | `Week: {= week}` |
| Row 2, Cell 2 | `Course Title:` | `Course Title: {= courseTitle}` |
| Row 3, Cell 1 | `Topic:` | `Topic: {= topic}` |
| Row 3, Cell 2 | `Duration:` | `Estimate duration in minutes: {= duration}` |

### Content Section

| Location | Description | Placeholder |
|----------|-------------|-------------|
| Row 6 (Content Standards value cell) | Standards text area | `{= contentStandards}` |
| Row 8, Cell 1 (Overview value cell) | Lesson overview area | `{= overview}` |
| Row 8, Cell 2 (Materials cell) | Keep existing checkboxes, add below | `{= additionalMaterials}` |
| Row 10 (Procedures value cell) | Teaching procedures area | `{= procedures}` |
| Row 14, Cell 2 (Differentiation value) | Differentiation strategies | `{= differentiation}` |
| Row 18, Cell 2 (Lesson Evaluation) | Evaluation text | `{= evaluation}` |

## Available Fields

The following fields will be populated from the lesson plan data:

| Field | Type | Description |
|-------|------|-------------|
| `week` | string | Week number (e.g., "Week 1") |
| `courseTitle` | string | Unit/course title |
| `topic` | string | Day's lesson topic |
| `duration` | string | Lesson duration in minutes |
| `contentStandards` | string | State/national standards alignment |
| `overview` | string | Lesson overview text |
| `additionalMaterials` | string | Additional materials needed (newline-separated) |
| `procedures` | string | Teaching procedures (formatted schedule) |
| `differentiation` | string | Differentiation strategies (Advanced/Struggling/ELL) |
| `evaluation` | string | Lesson evaluation notes |

## MVP Notes

For the initial MVP release:
- The template can be used as-is without placeholders
- The template-merger will gracefully handle missing placeholders (output unchanged template)
- Full placeholder editing requires manual Word editing by the user
- Future enhancement: programmatic DOCX XML manipulation to insert placeholders

## How to Edit the Template

1. Open `cte-lesson-plan.docx` in Microsoft Word
2. Navigate to each location listed above
3. Add the placeholder text in the `{= fieldName}` format
4. Ensure placeholders are inline text (not in text boxes or special formatting)
5. Save the document

## Testing Placeholders

After adding placeholders, test with the template-merger API:
```bash
curl -X POST /api/generate/template-merge \
  -H "Content-Type: application/json" \
  -d '{"templateId": "cte-lesson-plan", "data": {"week": "1", "topic": "Test"}}'
```
