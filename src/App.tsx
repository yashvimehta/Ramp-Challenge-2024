import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [isEmployee, setEmployee] = useState(false);


  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    await paginatedTransactionsUtils.fetchAll()

    setIsLoading(false)
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])


  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string | null) => {
       paginatedTransactionsUtils.invalidateData();
       if (!employeeId || employeeId === "all") {  /*bug 3 fix */
         await paginatedTransactionsUtils.fetchAll();
       } else {
         await transactionsByEmployeeUtils.fetchById(employeeId);
       }
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
   )

   /* bug 6 fix to keep track when an employee is selected*/
   const handleEmployee = useCallback(
    async (newValue: Employee | null) => {
      setEmployee(false)
      if (newValue === null) {
        return
      } else if (newValue.id === EMPTY_EMPLOYEE.id) {
        await loadAllTransactions()
      } else {
        setEmployee(true)
        await loadTransactionsByEmployee(newValue.id)
      }
    }, [loadAllTransactions, loadTransactionsByEmployee])



  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  const notHideButton  = paginatedTransactions?.nextPage !== null /* bug 6 fix */
  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          // isLoading={isLoading} /* bug 5 fix - not showing loading employees */
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={handleEmployee}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {transactions!=null  && !isEmployee && notHideButton &&(
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadAllTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
