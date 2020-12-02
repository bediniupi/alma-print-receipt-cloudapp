export interface Loan {
  author: string;
  call_number: string;
  circ_desk: ValueString;
  due_date: string;
  item_barcode: string;
  library: ValueString;
  loan_date: string;
  title: string;
  user_id: string;
}

export interface ValueString{
  value: string;
  desc: string;
}