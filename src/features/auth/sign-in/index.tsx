import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AuthLayout } from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

const testAccounts = [
  { username: 'admin', password: 'admin123', role: 'Admin' },
  { username: 'manager', password: 'manager123', role: 'Manager' },
  { username: 'cs_viu_1', password: 'agent123', role: 'Agent' },
  { username: 'cs_viu_2', password: 'agent123', role: 'Agent' },
  { username: 'cs_xp_1', password: 'agent123', role: 'Agent' },
  { username: 'cs_xp_2', password: 'agent123', role: 'Agent' },
]

export function SignIn() {
  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>Sign in</CardTitle>
          <CardDescription>
            Enter your username and password to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm />
        </CardContent>
      </Card>

      <Card className='mt-4 gap-2'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>
            Test Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='h-8 text-xs'>Username</TableHead>
                <TableHead className='h-8 text-xs'>Password</TableHead>
                <TableHead className='h-8 text-xs'>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testAccounts.map((account) => (
                <TableRow key={account.username}>
                  <TableCell className='py-1.5 font-mono text-xs'>
                    {account.username}
                  </TableCell>
                  <TableCell className='py-1.5 font-mono text-xs'>
                    {account.password}
                  </TableCell>
                  <TableCell className='py-1.5 text-xs'>
                    {account.role}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
