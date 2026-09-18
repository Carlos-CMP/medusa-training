import { B2BCart } from "@/types/global"
import { HttpTypes } from "@medusajs/types"
import { getCartLinePackaging } from "./b2b-packaging"

// Function to convert the cart items into CSV format
export function cartToCsv(cart: B2BCart) {
  const items = cart.items

  // Map each cart item to a structure suitable for CSV
  const itemData =
    items?.map((item: HttpTypes.StoreCartLineItem) => {
      const taxRate = item.tax_lines?.[0]?.rate || 0
      const totalPrice = item.quantity * item.unit_price
      const totalTax = totalPrice * taxRate
      const packaging = getCartLinePackaging(item.metadata, item.quantity)

      return {
        id: item.id,
        variant_id: item.variant_id,
        product_title: item.product_title,
        product_description: item.product_description?.replace(/\n/g, " "), // Replace newlines with spaces for CSV
        variant_sku: item.variant_sku || "",
        variant_title: item.variant_title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: taxRate,
        total_price: totalPrice,
        total_tax: totalTax,
        purchase_unit: packaging ? "box" : "unit",
        packages: packaging?.packageQuantity ?? "",
        units_per_box: packaging?.unitsPerBox ?? "",
        total_units: packaging?.unitQuantity ?? item.quantity,
        estimated_weight: packaging?.totalWeight ?? "",
        package_dimensions: packaging?.packageDimensions ?? "",
        boxes_per_pallet: packaging?.boxesPerPallet ?? "",
      }
    }) || []

  // Create CSV header
  const header = [
    "Item ID",
    "Variant ID",
    "Product Title",
    "Product Description",
    "Variant SKU",
    "Variant Title",
    "Quantity",
    "Unit Price",
    "Tax Rate",
    "Total Price",
    "Total Tax",
    "Purchase Unit",
    "Packages",
    "Units Per Box",
    "Total Units",
    "Estimated Weight",
    "Package Dimensions",
    "Boxes Per Pallet",
  ].join(",")

  // Create CSV rows
  const rows = itemData.map((item) =>
    [
      item.id,
      item.variant_id,
      `"${item.product_title}"`, // Wrapping in quotes for safety
      `"${item.product_description}"`, // Wrapping in quotes for safety
      item.variant_sku,
      `"${item.variant_title}"`, // Wrapping in quotes for safety
      item.quantity,
      item.unit_price.toFixed(2),
      item.tax_rate?.toFixed(2),
      item.total_price.toFixed(2),
      item.total_tax.toFixed(2),
      item.purchase_unit,
      item.packages,
      item.units_per_box,
      item.total_units,
      typeof item.estimated_weight === "number"
        ? item.estimated_weight.toFixed(1)
        : item.estimated_weight,
      `"${item.package_dimensions}"`,
      item.boxes_per_pallet,
    ].join(",")
  )

  // Combine header and rows
  const csv = [header, ...rows].join("\n")

  return csv
}
