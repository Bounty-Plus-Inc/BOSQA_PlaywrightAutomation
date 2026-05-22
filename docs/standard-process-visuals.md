# SO WITH CREDIT LIMIT - Visual Documentation

Screenshot folder (latest run):
- `test-results/screenshots/sales_standard_process/`

## Flow Visuals
1. `00_SalesOrder_Page_Opened.png`
   - Sales > Sales Order screen opened.
2. `01_Customer_Label_Visible.png`
   - Customer label checkpoint confirmed.
3. `02_BP_Code_Returned.png`
   - Customer code returned to main field `df_bpcode`.
4. `03_DocSeries_Selected.png`
   - Document series selected to `Sales Order (359)`.
5. `01_BP_Selected.png`
   - BP selection popup confirmed and accepted.
6. `04_Item_Updated.png`
   - Item selected, price/business center filled, line updated.
7. `05_Header_Details_Filled.png`
   - Header details set: Distribution Channel + Division.
8. `06_Status_Draft.png`
   - Save as Draft checkpoint (`D|Draft`).
9. `07_Status_Open_After_Add.png`
   - Add button clicked, document status switched to `O|Open`.
10. `10_CREDIT_LIMIT_APPROVAL.png`
   - Credit Limit Approval page filtered by BP code, with the matching Sales Order selected.
11. `11_CREDIT_LIMIT_APPROVAL_DONE.png`
   - Credit Limit Approval add/save completed successfully.
## Failure Visual Rule
If status does not become Open after `Add`, use:
- `ZZ_Status_Not_Open_Latest.png`

This is the primary failure visual for latest status state.
