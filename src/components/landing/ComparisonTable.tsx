"use client"

import { motion } from "framer-motion"
import { HiCheck, HiXMark, HiMinus } from "react-icons/hi2"

type CellValue = boolean | "partial" | string

type ComparisonRow = {
  feature: string
  values: CellValue[]
}

function CellContent({ value }: { value: CellValue }) {
  if (value === true) return <HiCheck className="w-4 h-4 text-green-600 mx-auto" />
  if (value === false) return <HiXMark className="w-4 h-4 text-gray-300 mx-auto" />
  if (value === "partial") return <HiMinus className="w-4 h-4 text-amber-500 mx-auto" />
  return <span className="text-xs text-gray-500">{value}</span>
}

export function ComparisonTable({
  platforms,
  rows,
  highlightIndex = 0,
}: {
  platforms: string[]
  rows: ComparisonRow[]
  highlightIndex?: number
}) {
  return (
    <section className="bg-[#f8f9fc] px-6 py-20">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <p
            className="text-xs font-bold tracking-[0.14em] uppercase mb-3"
            style={{
              background: "linear-gradient(135deg, #005EFC 0%, #4d94ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Comparison
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            How Inkray Compares
          </h2>
        </motion.div>

        <motion.div
          className="overflow-x-auto rounded-2xl border border-gray-100 bg-white"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.04)" }}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-4 px-5 text-gray-400 font-medium text-xs uppercase tracking-wider">
                  Feature
                </th>
                {platforms.map((p, i) => (
                  <th
                    key={p}
                    className={`py-4 px-4 text-center text-xs font-bold uppercase tracking-wider ${
                      i === highlightIndex
                        ? "text-[#005EFC] bg-primary/[0.03]"
                        : "text-gray-500"
                    }`}
                  >
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr
                  key={row.feature}
                  className={`border-b border-gray-50 last:border-b-0 ${
                    ri % 2 === 1 ? "bg-gray-50/50" : ""
                  }`}
                >
                  <td className="py-3.5 px-5 text-gray-700 font-medium text-[13px]">
                    {row.feature}
                  </td>
                  {row.values.map((val, ci) => (
                    <td
                      key={ci}
                      className={`py-3.5 px-4 text-center ${
                        ci === highlightIndex ? "bg-primary/[0.02]" : ""
                      }`}
                    >
                      <CellContent value={val} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  )
}
