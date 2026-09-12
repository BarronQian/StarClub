'use client'

import Link from 'next/link'
import {
  Fragment,
  useMemo,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type UserItem = {
  id: string
  discord_id: string | null
  username: string | null
  display_name: string | null
  avatar_url: string | null
  star_citizen_handle: string | null
  rsi_verified: boolean | null
  member_number: number | null
  profile_slug: string | null
  created_at: string
  muted_until: string | null
  banned_at: string | null
  moderation_reason: string | null
  moderated_by: string | null
}

type Props = {
  items: UserItem[]
  ownerUserId: string | null
  adminUserIds: string[]
  currentAdminIsOwner: boolean
}

type MuteDuration =
  | '1h'
  | '24h'
  | '7d'
  | 'permanent'

function isMuted(
  mutedUntil: string | null,
) {
  if (!mutedUntil) {
    return false
  }

  return (
    new Date(mutedUntil).getTime() >
    Date.now()
  )
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString(
    'zh-CN',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    },
  )
}

function getDisplayName(
  user: UserItem,
) {
  return (
    user.display_name ||
    user.star_citizen_handle ||
    user.username ||
    '未命名用户'
  )
}

export function UserAdminList({
  items,
  ownerUserId,
  adminUserIds,
  currentAdminIsOwner,
}: Props) {
  const router =
    useRouter()

  const [search, setSearch] =
    useState('')

  const [
    editingMuteId,
    setEditingMuteId,
  ] = useState<string | null>(
    null,
  )

  const [
    muteDuration,
    setMuteDuration,
  ] =
    useState<MuteDuration>(
      '24h',
    )

  const [
    muteReason,
    setMuteReason,
  ] = useState('')

  const [
    editingBanId,
    setEditingBanId,
  ] = useState<string | null>(
    null,
  )

  const [
    banReason,
    setBanReason,
  ] = useState('')

  const [
    processingId,
    setProcessingId,
  ] = useState<string | null>(
    null,
  )

  const adminUserIdSet =
    useMemo(
      () =>
        new Set(
          adminUserIds,
        ),
      [adminUserIds],
    )

  const filteredItems =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase()

      if (!keyword) {
        return items
      }

      return items.filter(
        (user) => {
          const values = [
            user.id,
            user.discord_id,
            user.username,
            user.display_name,
            user.star_citizen_handle,
            user.profile_slug,
            user.member_number?.toString(),
          ]

          return values.some(
            (value) =>
              value
                ?.toLowerCase()
                .includes(
                  keyword,
                ),
          )
        },
      )
    }, [items, search])

  async function handleMute(
    user: UserItem,
  ) {
    if (!muteReason.trim()) {
      toast.error(
        '请填写禁言原因',
      )
      return
    }

    const confirmed =
      window.confirm(
        `确认禁言 ${getDisplayName(
          user,
        )}？`,
      )

    if (!confirmed) {
      return
    }

    setProcessingId(user.id)

    try {
      const response =
        await fetch(
          '/api/admin/users/mute',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(
              {
                userId:
                  user.id,
                duration:
                  muteDuration,
                reason:
                  muteReason.trim(),
              },
            ),
          },
        )

      const data =
        await response
          .json()
          .catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.error ||
            '禁言失败',
        )
      }

      toast.success(
        '用户已禁言',
      )

      setEditingMuteId(
        null,
      )
      setMuteReason('')
      setMuteDuration(
        '24h',
      )

      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : '禁言失败',
      )
    } finally {
      setProcessingId(
        null,
      )
    }
  }

  async function handleUnmute(
    user: UserItem,
  ) {
    const confirmed =
      window.confirm(
        `确认解除 ${getDisplayName(
          user,
        )} 的禁言？`,
      )

    if (!confirmed) {
      return
    }

    setProcessingId(user.id)

    try {
      const response =
        await fetch(
          '/api/admin/users/mute',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(
              {
                userId:
                  user.id,
                duration:
                  'remove',
                reason: '',
              },
            ),
          },
        )

      const data =
        await response
          .json()
          .catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.error ||
            '解除禁言失败',
        )
      }

      toast.success(
        '禁言已解除',
      )

      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : '解除禁言失败',
      )
    } finally {
      setProcessingId(
        null,
      )
    }
  }

  async function handleBan(
    user: UserItem,
  ) {
    if (!banReason.trim()) {
      toast.error(
        '请填写封禁原因',
      )
      return
    }

    const confirmed =
      window.confirm(
        `确认封禁 ${getDisplayName(
          user,
        )}？`,
      )

    if (!confirmed) {
      return
    }

    setProcessingId(user.id)

    try {
      const response =
        await fetch(
          '/api/admin/users/ban',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(
              {
                userId:
                  user.id,
                action:
                  'ban',
                reason:
                  banReason.trim(),
              },
            ),
          },
        )

      const data =
        await response
          .json()
          .catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.error ||
            '封禁失败',
        )
      }

      toast.success(
        '用户已封禁',
      )

      setEditingBanId(
        null,
      )
      setBanReason('')

      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : '封禁失败',
      )
    } finally {
      setProcessingId(
        null,
      )
    }
  }

  async function handleUnban(
    user: UserItem,
  ) {
    const confirmed =
      window.confirm(
        `确认解除 ${getDisplayName(
          user,
        )} 的封禁？`,
      )

    if (!confirmed) {
      return
    }

    setProcessingId(user.id)

    try {
      const response =
        await fetch(
          '/api/admin/users/ban',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(
              {
                userId:
                  user.id,
                action:
                  'unban',
                reason: '',
              },
            ),
          },
        )

      const data =
        await response
          .json()
          .catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.error ||
            '解除封禁失败',
        )
      }

      toast.success(
        '封禁已解除',
      )

      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : '解除封禁失败',
      )
    } finally {
      setProcessingId(
        null,
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            用户管理
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            搜索用户，并进行禁言、封禁与解除处罚。
          </p>
        </div>

        <div className="w-full md:w-80">
          <Input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="搜索用户名 / Handle / ID"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-275 text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-5 py-4 text-left font-medium">
                  用户
                </th>
                <th className="px-5 py-4 text-left font-medium">
                  StarClub
                </th>
                <th className="px-5 py-4 text-left font-medium">
                  状态
                </th>
                <th className="px-5 py-4 text-left font-medium">
                  处罚信息
                </th>
                <th className="px-5 py-4 text-left font-medium">
                  注册时间
                </th>
                <th className="px-5 py-4 text-right font-medium">
                  操作
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredItems.map(
                (user) => {
                  const owner =
                    ownerUserId !== null &&
                    user.id === ownerUserId

                  const admin =
                    !owner &&
                    adminUserIdSet.has(
                      user.id,
                    )

                  /*
                   * Owner 永远不可处罚。
                   *
                   * 普通 Admin 不能处罚其他 Admin。
                   * 最高权限 Owner 登录后台时，
                   * 可以处罚普通 Admin。
                   */
                  const protectedFromModeration =
                    owner ||
                    (
                      admin &&
                      !currentAdminIsOwner
                    )

                  const banned =
                    Boolean(
                      user.banned_at,
                    )

                  const muted =
                    !banned &&
                    isMuted(
                      user.muted_until,
                    )

                  const processing =
                    processingId ===
                    user.id

                  let statusLabel =
                    '正常'

                  let statusClass =
                    'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'

                  if (banned) {
                    statusLabel =
                      '已封禁'

                    statusClass =
                      'border-red-500/20 bg-red-500/10 text-red-600'
                  } else if (
                    muted
                  ) {
                    statusLabel =
                      '禁言中'

                    statusClass =
                      'border-amber-500/20 bg-amber-500/10 text-amber-600'
                  }

                  return (
                    <Fragment
                      key={user.id}
                    >
                      <tr className="border-b align-top last:border-b-0">
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                              <img
                                src={
                                  user.avatar_url
                                }
                                alt=""
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                {getDisplayName(
                                  user,
                                )
                                  .slice(
                                    0,
                                    2,
                                  )
                                  .toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">
                                  {getDisplayName(
                                    user,
                                  )}
                                </span>

                                {owner && (
                                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                    OWNER
                                  </span>
                                )}

                                {admin && (
                                  <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-600">
                                    ADMIN
                                  </span>
                                )}

                                {user.rsi_verified && (
                                  <span className="rounded-full border px-2 py-0.5 text-[10px]">
                                    RSI 已认证
                                  </span>
                                )}
                              </div>

                              <div className="mt-1 text-xs text-muted-foreground">
                                {user.star_citizen_handle
                                  ? `Handle: ${user.star_citizen_handle}`
                                  : '未绑定 Star Citizen Handle'}
                              </div>

                              <div className="mt-1 break-all text-[11px] text-muted-foreground/70">
                                {user.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <div>
                            {user.member_number
                              ? `#${user.member_number}`
                              : '—'}
                          </div>

                          {user.profile_slug && (
                            <Link
                              href={`/community/profile/${encodeURIComponent(
                                user.profile_slug,
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-block text-xs text-primary hover:underline"
                            >
                              查看主页
                            </Link>
                          )}
                        </td>

                        <td className="px-5 py-5">
                          {owner ? (
                            <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                              最高权限
                            </span>
                          ) : admin ? (
                            <span className="inline-flex rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-600">
                              管理组
                            </span>
                          ) : (
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass}`}
                            >
                              {statusLabel}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-5">
                          {owner ? (
                            <span className="text-xs text-muted-foreground">
                              不可处罚
                            </span>
                          ) : admin &&
                            !currentAdminIsOwner ? (
                            <span className="text-xs text-muted-foreground">
                              管理员之间不可互相处罚
                            </span>
                          ) : user.moderation_reason ? (
                            <div className="max-w-xs">
                              <div className="text-sm">
                                {
                                  user.moderation_reason
                                }
                              </div>

                              {muted &&
                                user.muted_until && (
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    禁言至：
                                    {formatDate(
                                      user.muted_until,
                                    )}
                                  </div>
                                )}

                              {banned &&
                                user.banned_at && (
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    封禁于：
                                    {formatDate(
                                      user.banned_at,
                                    )}
                                  </div>
                                )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-5 text-muted-foreground">
                          {formatDate(
                            user.created_at,
                          )}
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex justify-end gap-2">
                            {owner ? (
                              <span className="rounded-lg border px-3 py-2 text-xs text-muted-foreground">
                                不可管理
                              </span>
                            ) : admin &&
                              !currentAdminIsOwner ? (
                              <span className="rounded-lg border px-3 py-2 text-xs text-muted-foreground">
                                管理组保护
                              </span>
                            ) : banned ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                  processing
                                }
                                onClick={() =>
                                  void handleUnban(
                                    user,
                                  )
                                }
                              >
                                {processing
                                  ? '处理中...'
                                  : '解除封禁'}
                              </Button>
                            ) : (
                              <>
                                {muted ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                      processing
                                    }
                                    onClick={() =>
                                      void handleUnmute(
                                        user,
                                      )
                                    }
                                  >
                                    {processing
                                      ? '处理中...'
                                      : '解除禁言'}
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingBanId(
                                        null,
                                      )

                                      setEditingMuteId(
                                        editingMuteId ===
                                          user.id
                                          ? null
                                          : user.id,
                                      )
                                    }}
                                  >
                                    禁言
                                  </Button>
                                )}

                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setEditingMuteId(
                                      null,
                                    )

                                    setEditingBanId(
                                      editingBanId ===
                                        user.id
                                        ? null
                                        : user.id,
                                    )
                                  }}
                                >
                                  封禁
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {editingMuteId ===
                        user.id &&
                        !protectedFromModeration &&
                        !banned && (
                          <tr className="border-b bg-muted/20">
                            <td
                              colSpan={6}
                              className="px-5 py-5"
                            >
                              <div className="ml-auto grid max-w-2xl gap-4 rounded-xl border bg-background p-4">
                                <div>
                                  <h3 className="font-medium">
                                    禁言用户
                                  </h3>

                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {getDisplayName(
                                      user,
                                    )}
                                  </p>
                                </div>

                                <div className="grid gap-2">
                                  <Label>
                                    禁言时长
                                  </Label>

                                  <select
                                    value={
                                      muteDuration
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      setMuteDuration(
                                        event.target
                                          .value as MuteDuration,
                                      )
                                    }
                                    className="h-10 rounded-md border bg-background px-3 text-sm"
                                  >
                                    <option value="1h">
                                      1 小时
                                    </option>

                                    <option value="24h">
                                      24 小时
                                    </option>

                                    <option value="7d">
                                      7 天
                                    </option>

                                    <option value="permanent">
                                      永久禁言
                                    </option>
                                  </select>
                                </div>

                                <div className="grid gap-2">
                                  <Label>
                                    禁言原因
                                  </Label>

                                  <Textarea
                                    value={
                                      muteReason
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      setMuteReason(
                                        event.target
                                          .value,
                                      )
                                    }
                                    placeholder="填写处罚原因"
                                    rows={3}
                                  />
                                </div>

                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setEditingMuteId(
                                        null,
                                      )
                                      setMuteReason(
                                        '',
                                      )
                                    }}
                                  >
                                    取消
                                  </Button>

                                  <Button
                                    disabled={
                                      processing
                                    }
                                    onClick={() =>
                                      void handleMute(
                                        user,
                                      )
                                    }
                                  >
                                    {processing
                                      ? '处理中...'
                                      : '确认禁言'}
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                      {editingBanId ===
                        user.id &&
                        !protectedFromModeration &&
                        !banned && (
                          <tr className="border-b bg-red-500/5">
                            <td
                              colSpan={6}
                              className="px-5 py-5"
                            >
                              <div className="ml-auto grid max-w-2xl gap-4 rounded-xl border border-red-500/20 bg-background p-4">
                                <div>
                                  <h3 className="font-medium text-red-600">
                                    封禁用户
                                  </h3>

                                  <p className="mt-1 text-xs text-muted-foreground">
                                    封禁后该账号将被标记为已封禁。
                                  </p>
                                </div>

                                <div className="grid gap-2">
                                  <Label>
                                    封禁原因
                                  </Label>

                                  <Textarea
                                    value={
                                      banReason
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      setBanReason(
                                        event.target
                                          .value,
                                      )
                                    }
                                    placeholder="例如：多次发布违规内容"
                                    rows={3}
                                  />
                                </div>

                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setEditingBanId(
                                        null,
                                      )
                                      setBanReason(
                                        '',
                                      )
                                    }}
                                  >
                                    取消
                                  </Button>

                                  <Button
                                    variant="destructive"
                                    disabled={
                                      processing
                                    }
                                    onClick={() =>
                                      void handleBan(
                                        user,
                                      )
                                    }
                                  >
                                    {processing
                                      ? '处理中...'
                                      : '确认封禁'}
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                    </Fragment>
                  )
                },
              )}
            </tbody>
          </table>
        </div>

        {filteredItems.length ===
          0 && (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            没有找到符合条件的用户。
          </div>
        )}
      </div>
    </div>
  )
}