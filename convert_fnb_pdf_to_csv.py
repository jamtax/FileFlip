import tkinter as tk
from tkinter import filedialog, messagebox
import pandas as pd
import pdfplumber
import os
import traceback

def extract_transactions_from_pdf(pdf_path):
    extracted_data = []

    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_number, page in enumerate(pdf.pages, start=1):
                try:
                    table = page.extract_table()
                    if not table:
                        continue
                    headers = [cell.strip() if cell else "" for cell in table[0]]
                    
                    # Check if the table has expected columns
                    if any(col.lower().startswith("date") for col in headers):
                        for row in table[1:]:
                            if row and len(row) >= 3:
                                date = row[0].strip() if row[0] else ""
                                desc = row[1].strip() if row[1] else ""
                                amt = row[2].strip() if row[2] else ""
                                if date and desc and amt:
                                    extracted_data.append([date, desc, amt])
                except Exception as e:
                    print(f"[!] Failed to process page {page_number} of {pdf_path}: {e}")
    except Exception as e:
        raise Exception(f"❌ Unable to open or read PDF: {pdf_path}\n{str(e)}")

    return extracted_data

def browse_pdf_files():
    file_paths = filedialog.askopenfilenames(filetypes=[("PDF files", "*.pdf")], title="Select FNB PDF Statements")
    if file_paths:
        file_list.delete(0, tk.END)
        for path in file_paths:
            file_list.insert(tk.END, path)

def convert_pdfs():
    files = file_list.get(0, tk.END)
    if not files:
        messagebox.showwarning("No Files Selected", "Please select PDF files first.")
        return

    all_data = []
    for file in files:
        try:
            messagebox.showinfo("Processing", f"Processing: {os.path.basename(file)}")
            transactions = extract_transactions_from_pdf(file)
            if transactions:
                all_data.extend(transactions)
            else:
                messagebox.showwarning("No Data", f"No valid transactions found in:\n{os.path.basename(file)}")
        except Exception as e:
            traceback.print_exc()
            messagebox.showerror("Error", f"Error processing file:\n{file}\n\n{e}")

    if not all_data:
        messagebox.showinfo("No Data", "No transactions were extracted from the selected files.")
        return

    save_path = filedialog.asksaveasfilename(
        defaultextension=".csv",
        filetypes=[("CSV files", "*.csv")],
        title="Save Converted Transactions As"
    )
    if save_path:
        try:
            df = pd.DataFrame(all_data, columns=["Date", "Description", "Amount"])
            df.to_csv(save_path, index=False)
            messagebox.showinfo("Success", f"Transactions saved successfully:\n{save_path}")
        except Exception as e:
            messagebox.showerror("Save Error", f"Failed to save the CSV file.\n\n{str(e)}")

# GUI Setup
root = tk.Tk()
root.title("📄 FNB PDF Statement to CSV Converter")
root.geometry("600x400")
root.resizable(False, False)

frame = tk.Frame(root, padx=20, pady=20)
frame.pack(fill=tk.BOTH, expand=True)

tk.Label(frame, text="Selected PDF Statements:", font=("Segoe UI", 10)).pack(anchor="w")

file_list = tk.Listbox(frame, width=80, height=12)
file_list.pack(pady=10)

button_frame = tk.Frame(frame)
button_frame.pack(pady=10)

tk.Button(button_frame, text="📂 Browse PDF Files", command=browse_pdf_files, width=20).pack(side=tk.LEFT, padx=5)
tk.Button(button_frame, text="✅ Convert to CSV", command=convert_pdfs, width=20).pack(side=tk.LEFT, padx=5)

root.mainloop()
