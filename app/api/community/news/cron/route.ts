import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  POST as syncNews,
} from '../sync/route'

export async function GET(
  request: NextRequest
) {
  const cronSecret =
    process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json(
      {
        error:
          'Missing CRON_SECRET',
      },
      {
        status: 500,
      }
    )
  }

  const authorization =
    request.headers.get(
      'authorization'
    )

  if (
    authorization !==
    `Bearer ${cronSecret}`
  ) {
    return NextResponse.json(
      {
        error:
          'Unauthorized',
      },
      {
        status: 401,
      }
    )
  }

  try {
    /*
      直接调用现有 RSI sync，
      不通过 HTTP 请求自己的网站。
    */
    return await syncNews()
  } catch (error) {
    console.error(
      'StarClub news cron error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Cron sync failed',
      },
      {
        status: 500,
      }
    )
  }
}