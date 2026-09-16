import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@supabase/supabase-js'

import {
  requireAdminApi,
} from '@/lib/admin-auth'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

type IncomingBlock = {
  id?: string
  block_type?: string
  block_order?: number
  content?: Record<
    string,
    unknown
  >
}

const ALLOWED_BLOCK_TYPES =
  new Set([
    'section',
    'heading',
    'paragraph',
    'image',
    'gallery',
    'list',
    'callout',
    'video',
  ])

function getAdminSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      'Missing Supabase server environment variables',
    )
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}

export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  const auth =
    await requireAdminApi()

  if (auth.response) {
    return auth.response
  }

  try {
    const {
      id: guideId,
    } = await context.params

    const body =
      await request.json()

    const incomingBlocks:
      IncomingBlock[] =
      Array.isArray(
        body.blocks,
      )
        ? body.blocks
        : []

    const supabase =
      getAdminSupabase()

    const {
      data: guide,
      error: guideError,
    } = await supabase
      .from('guides')
      .select('id, type')
      .eq(
        'id',
        guideId,
      )
      .single()

    if (
      guideError ||
      !guide
    ) {
      return NextResponse.json(
        {
          error:
            '攻略不存在',
        },
        {
          status: 404,
        },
      )
    }

    if (
      guide.type !==
      'article'
    ) {
      return NextResponse.json(
        {
          error:
            '只有图文攻略可以保存正文 Block',
        },
        {
          status: 400,
        },
      )
    }

    const normalizedBlocks =
      incomingBlocks.map(
        (
          block,
          index,
        ) => {
          const blockType =
            String(
              block.block_type ??
                '',
            )

          if (
            !ALLOWED_BLOCK_TYPES.has(
              blockType,
            )
          ) {
            throw new Error(
              `不支持的 Block 类型：${blockType}`,
            )
          }

          return {
            guide_id:
              guideId,

            block_type:
              blockType,

            block_order:
              (index + 1) *
              10,

            content:
              block.content &&
              typeof block.content ===
                'object'
                ? block.content
                : {},
          }
        },
      )

    const {
      error: deleteError,
    } = await supabase
      .from(
        'guide_content_blocks',
      )
      .delete()
      .eq(
        'guide_id',
        guideId,
      )

    if (deleteError) {
      console.error(
        '[ADMIN GUIDE BLOCKS] Delete failed:',
        deleteError,
      )

      return NextResponse.json(
        {
          error:
            '清理旧正文失败',
        },
        {
          status: 500,
        },
      )
    }

    if (
      normalizedBlocks.length ===
      0
    ) {
      return NextResponse.json(
        {
          ok: true,
          blocks: [],
        },
      )
    }

    const {
      data: insertedBlocks,
      error: insertError,
    } = await supabase
      .from(
        'guide_content_blocks',
      )
      .insert(
        normalizedBlocks,
      )
      .select(`
        id,
        block_type,
        block_order,
        content
      `)
      .order(
        'block_order',
        {
          ascending: true,
        },
      )

    if (insertError) {
      console.error(
        '[ADMIN GUIDE BLOCKS] Insert failed:',
        insertError,
      )

      return NextResponse.json(
        {
          error:
            '保存正文失败',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      ok: true,
      blocks:
        insertedBlocks ??
        [],
    })
  } catch (error) {
    console.error(
      '[ADMIN GUIDE BLOCKS] PUT failed:',
      error,
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '保存正文失败',
      },
      {
        status: 500,
      },
    )
  }
}