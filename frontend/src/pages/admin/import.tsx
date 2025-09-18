import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  FiUploadCloud,
  FiDownload,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

export default function AdminImport() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {}, [router]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setProcessing(false);
  };

  const sampleCsv = `SKU,Product Name,Price,Category,Vendor,License Keys,Status\nMCAF-CHATEN-2024,McAfee Chat Enterprise 2024,137.99,Analytics Tools,McAfee LLC,5,Active`;

  const downloadSample = () => {
    const blob = new Blob([sampleCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "catalog_sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Shared product data (single source of truth)
  const products = [
    {
      sku: "SAF-CL-GUIDC-STD-6881",
      name: "Salesforce Cloud Console Standard",
      price: 110.99,
      category: "Analytics Tools",
      vendor: "Salesforce Inc.",
      keys: 15,
      status: "Active",
    },
    {
      sku: "MCAF-CHATEN-2024-0082",
      name: "McAfee Chat Enterprise 2024",
      price: 137.99,
      category: "Analytics Tools",
      vendor: "McAfee LLC",
      keys: 5,
      status: "Active",
    },
    {
      sku: "MALW-CHATEN-Pro-9083",
      name: "Malwarebytes Chat Enterprise Pro",
      price: 372.99,
      category: "Audio Production",
      vendor: "Malwarebytes Inc.",
      keys: 0,
      status: "Active",
    },
    {
      sku: "BOXI-CODER2-2924-0084",
      name: "Box Coder 2.0",
      price: 29.99,
      category: "Communication Tools",
      vendor: "Box Inc.",
      keys: 9,
      status: "Active",
    },
    {
      sku: "ORACLE-COREDES-9005",
      name: "Oracle Code Professional 9005",
      price: 4475.99,
      category: "CAD Software",
      vendor: "Oracle",
      keys: 3,
      status: "Active",
    },
  ];

  return (
    <>
      <Head>
        <title>Catalog Import • Lootamo Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-100 flex">
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col">
          <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

          <main className="px-4 sm:px-6 xl:px-8 py-6 space-y-6">
            <h1 className="text-xl font-semibold text-gray-900">
              Catalog Import & Management
            </h1>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 bg-white rounded-xl shadow-lg p-5 border hover:shadow-xl transition-all duration-300">
                <h2 className="font-semibold">Catalog Import</h2>

                <div
                  className={`mt-3 rounded-lg border-2 border-dashed p-6 flex flex-col items-center justify-center text-center transition-all duration-300 ${
                    dragOver
                      ? "border-blue-400 bg-blue-100"
                      : "border-gray-300 bg-white"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <FiUploadCloud className="text-3xl text-gray-500" />
                  <p className="mt-2 text-sm text-gray-600">
                    Upload Product Catalog CSV
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports large catalogs with staging table processing and
                    validation
                  </p>

                  <div className="mt-4 flex w-full gap-2 items-center">
                    <button
                      className="px-3 py-2 rounded border text-sm hover:bg-gray-50 transition-all duration-300"
                      onClick={() => inputRef.current?.click()}
                    >
                      Choose file
                    </button>
                    <span className="text-sm text-gray-600 truncate flex-1">
                      {file ? file.name : "No file chosen"}
                    </span>
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={handleProcess}
                    disabled={!file || processing}
                    className={`px-3 py-2 rounded text-white text-sm transition-all duration-300 ${
                      !file || processing
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-slate-900 hover:bg-slate-800"
                    }`}
                  >
                    {processing ? "Processing…" : "Process Import"}
                  </button>
                  <button
                    onClick={downloadSample}
                    className="flex items-center gap-2 px-3 py-2 rounded border text-sm hover:bg-gray-50 transition-all duration-300"
                  >
                    <FiDownload /> Download Sample CSV
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                  <div className="rounded border p-3">
                    <div className="text-xs text-gray-500">Staging Tables</div>
                    <div className="mt-1 inline-flex items-center gap-1 text-emerald-600 font-medium">
                      <FiCheckCircle /> Enabled
                    </div>
                  </div>
                  <div className="rounded border p-3">
                    <div className="text-xs text-gray-500">
                      Batch Processing
                    </div>
                    <div className="mt-1 text-gray-800 font-medium">
                      1000/batch
                    </div>
                  </div>
                  <div className="rounded border p-3">
                    <div className="text-xs text-gray-500">Validation</div>
                    <div className="mt-1 inline-flex items-center gap-1 text-blue-600 font-medium">
                      <FiCheckCircle /> Pre-insert
                    </div>
                  </div>
                  <div className="rounded border p-3">
                    <div className="text-xs text-gray-500">Error Handling</div>
                    <div className="mt-1 inline-flex items-center gap-1 text-amber-600 font-medium">
                      <FiAlertCircle /> Quarantine
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-5 border hover:shadow-xl transition-all duration-300">
                <h2 className="font-semibold">Import Process</h2>
                <ol className="mt-3 space-y-3 text-sm">
                  <li>
                    <div className="font-medium">Step 1</div>
                    <div className="text-gray-600">
                      CSV Validation — Check required fields, data types,
                      formats
                    </div>
                  </li>
                  <li>
                    <div className="font-medium">Step 2</div>
                    <div className="text-gray-600">
                      Staging Load — Load data to staging table (non-disruptive)
                    </div>
                  </li>
                  <li>
                    <div className="font-medium">Step 3</div>
                    <div className="text-gray-600">
                      Batch Processing — Process in 1000-record batches
                    </div>
                  </li>
                  <li>
                    <div className="font-medium">Step 4</div>
                    <div className="text-gray-600">
                      Upsert Logic — Insert new, update changed records only
                    </div>
                  </li>
                  <li>
                    <div className="font-medium">Step 5</div>
                    <div className="text-gray-600">
                      License Generation — Auto-generate encrypted license keys
                    </div>
                  </li>
                </ol>
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-lg p-5 border hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Current Product Catalog</h2>
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
                    2500 Products
                  </span>
                  <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-700">
                    49549 Available Keys
                  </span>
                </div>
              </div>

              {/* Mobile / Tablet: Cards */}
              <div className="mt-4 flex flex-col gap-4 xl:hidden">
                {products.map((r) => (
                  <div
                    key={r.sku}
                    className="border rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium text-sm truncate">
                        {r.name}
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded ${
                          r.status === "Available" || r.keys > 0
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <div className="text-gray-600">
                        <span className="text-gray-500">SKU:</span> {r.sku}
                      </div>
                      <div className="text-gray-600">
                        <span className="text-gray-500">Price:</span> $
                        {r.price.toFixed(2)}
                      </div>
                      <div className="text-gray-600">
                        <span className="text-gray-500">Category:</span>{" "}
                        {r.category}
                      </div>
                      <div className="text-gray-600">
                        <span className="text-gray-500">Vendor:</span>{" "}
                        {r.vendor}
                      </div>
                      <div className="text-gray-600 col-span-2">
                        <span className="text-gray-500">License Keys:</span>{" "}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded ${
                            r.keys > 0
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {r.keys > 0 ? `${r.keys} available` : "Out of keys"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="mt-4 overflow-x-auto hidden xl:block">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-4">SKU</th>
                      <th className="py-2 pr-4">Product Name</th>
                      <th className="py-2 pr-4 whitespace-nowrap">Price</th>
                      <th className="py-2 pr-4">Category</th>
                      <th className="py-2 pr-4">Vendor</th>
                      <th className="py-2 pr-4">License Keys</th>
                      <th className="py-2 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((r) => (
                      <tr
                        key={r.sku}
                        className="border-b last:border-0 hover:bg-gray-50 transition-all duration-200"
                      >
                        <td className="py-2 pr-4 font-mono text-xs text-rose-600 whitespace-nowrap">
                          {r.sku}
                        </td>
                        <td className="py-2 pr-4 max-w-[200px] truncate">
                          {r.name}
                        </td>
                        <td className="py-2 pr-4 whitespace-nowrap">
                          ${r.price.toFixed(2)}
                        </td>
                        <td className="py-2 pr-4">{r.category}</td>
                        <td className="py-2 pr-4">{r.vendor}</td>
                        <td className="py-2 pr-4">
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              r.keys > 0
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {r.keys > 0 ? `${r.keys} available` : "Out of keys"}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
