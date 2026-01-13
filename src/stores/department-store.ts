import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Department = 'all' | 'viufinder' | 'viufinder_xp'

interface DepartmentState {
  selectedDepartment: Department
  setDepartment: (department: Department) => void
}

export const useDepartmentStore = create<DepartmentState>()(
  persist(
    (set) => ({
      selectedDepartment: 'all',
      setDepartment: (department) => set({ selectedDepartment: department }),
    }),
    {
      name: 'wa-crm-department',
    }
  )
)
