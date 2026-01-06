import { AxiosError } from 'axios'
import { toast } from 'sonner'

export function handleServerError(error: unknown) {
  let errMsg = 'Something went wrong!'

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = 'Content not found.'
  }

  if (error instanceof AxiosError) {
    // Backend returns { detail: "message" } for errors
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') {
      errMsg = detail
    } else if (Array.isArray(detail)) {
      // Validation errors return array of { loc, msg, type }
      errMsg = detail.map((e) => e.msg).join(', ')
    } else if (error.response?.data?.title) {
      errMsg = error.response.data.title
    }
  }

  toast.error(errMsg)
}
