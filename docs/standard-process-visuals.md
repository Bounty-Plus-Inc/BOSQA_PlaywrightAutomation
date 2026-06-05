# SO WITH CREDIT LIMIT - Visual Documentation

Screenshot folder (latest run):
- `test-results/screenshots/sales_standard_process/`

## Flow Visuals
1. `00_SalesOrder_Page_Opened.png`
   - Sales > Sales Order screen opened.
2. `01_Customer_Label_Visible.png`
   - Customer label checkpoint confirmed.
3. `02_BP_CFL_POPUP.png`
   - Business Partner CFL popup opened before customer selection.
4. `02_BP_Code_Returned.png`
   - Customer code returned to main field `df_bpcode`.
5. `03_DocSeries_Selected.png`
   - Document series selected to `Sales Order (359)`.
6. `01_BP_Selected.png`
   - BP selection popup confirmed and accepted.
7. `04_ITEM_CFL_POPUP.png`
   - Item CFL popup opened before item selection.
8. `04_Item_Updated.png`
   - Item selected, price/business center filled, line updated.
9. `05_Header_Details_Filled.png`
   - Header details set: Distribution Channel + Division.
10. `06_Status_Draft.png`
   - Save as Draft checkpoint (`D|Draft`).
11. `07_Status_Open_After_Add.png`
   - Add button clicked, document status switched to `O|Open`.
12. `10_CREDIT_LIMIT_APPROVAL.png`
   - Credit Limit Approval page filtered by BP code, with the matching Sales Order selected.
13. `11_CREDIT_LIMIT_APPROVAL_DONE.png`
   - Credit Limit Approval add/save completed successfully.
## Failure Visual Rule
If status does not become Open after `Add`, use:
- `ZZ_Status_Not_Open_Latest.png`

This is the primary failure visual for latest status state.
