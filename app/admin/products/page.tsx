"use client"

import { useState } from "react"
import { ProductsPageHeader } from "@/components/admin/products-page-header"
import { ProductsToolbar } from "@/components/admin/products-toolbar"
import { ProductsTable } from "@/components/admin/products-table"
import { AddProductModal } from "@/components/admin/add-product"

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [openModal, setOpenModal] = useState(false)

  // refreshSignal increments to tell ProductsTable to reload
  const [refreshSignal, setRefreshSignal] = useState(0)
  const refreshData = () => setRefreshSignal((s) => s + 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <ProductsPageHeader onAdd={() => setOpenModal(true)} />

      {/* Toolbar */}
      <ProductsToolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
      />

      {/* Table */}
      <ProductsTable
        searchTerm={searchTerm}
        categoryFilter={categoryFilter}
        refreshSignal={refreshSignal}
      />

      {/* Add Product Modal */}
      <AddProductModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={() => {
          refreshData()
          setOpenModal(false)
        }}
      />
    </div>
  )
}