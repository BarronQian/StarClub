'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ExternalLink,
  Link2,
  Search,
  Star,
  Unlink,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AdminHeader } from '@/components/admin/admin-header'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { GalleryForm } from '@/components/admin/gallery-form'
import { GalleryEditDialog } from '@/components/admin/gallery-edit-dialog'

import { GALLERY_CATEGORY_LABEL } from '@/lib/gallery'
import type { AdminGalleryShot } from '@/lib/gallery-db'
import { readJsonResponse } from '@/lib/read-json-response'

type GalleryProfileOption = {
  id: string
  username: string | null
  displayName: string | null
  starCitizenHandle: string | null
  profileSlug: string | null
}

type GalleryShotWithHero =
  AdminGalleryShot & {
    heroFeatured?: boolean
  }

function getProfileName(
  profile: GalleryProfileOption,
) {
  return (
    profile.starCitizenHandle ||
    profile.displayName ||
    profile.username ||
    '未命名用户'
  )
}

function getProfileSubline(
  profile: GalleryProfileOption,
) {
  const parts = [
    profile.username
      ? `@${profile.username}`
      : null,
    profile.displayName,
  ].filter(Boolean)

  return parts.join(' · ')
}

export function GalleryAdmin({
  initialShots,
  profiles,
  adminEmail,
}: {
  initialShots: AdminGalleryShot[]
  profiles: GalleryProfileOption[]
  adminEmail: string
}) {
  const [shots, setShots] =
    useState<GalleryShotWithHero[]>(
      initialShots,
    )

  const [
    editingShot,
    setEditingShot,
  ] =
    useState<AdminGalleryShot | null>(
      null,
    )

  const [
    editOpen,
    setEditOpen,
  ] = useState(false)

  const [
    deleteTarget,
    setDeleteTarget,
  ] =
    useState<GalleryShotWithHero | null>(
      null,
    )

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false)

  const [
    bindingTarget,
    setBindingTarget,
  ] =
    useState<GalleryShotWithHero | null>(
      null,
    )

  const [
    bindingOpen,
    setBindingOpen,
  ] = useState(false)

  const [
    profileSearch,
    setProfileSearch,
  ] = useState('')

  const [
    isBinding,
    setIsBinding,
  ] = useState(false)

  const [
    togglingHeroIds,
    setTogglingHeroIds,
  ] = useState<Set<number>>(
    new Set(),
  )

  const sortedShots = useMemo(
    () =>
      [...shots].sort(
        (a, b) =>
          new Date(
            b.publishedAt,
          ).getTime() -
          new Date(
            a.publishedAt,
          ).getTime(),
      ),
    [shots],
  )

  const filteredProfiles =
    useMemo(() => {
      const query =
        profileSearch
          .trim()
          .toLowerCase()

      if (!query) {
        return profiles.slice(
          0,
          50,
        )
      }

      return profiles
        .filter(
          (profile) => {
            const searchable = [
              profile.username,
              profile.displayName,
              profile.starCitizenHandle,
              profile.profileSlug,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()

            return searchable.includes(
              query,
            )
          },
        )
        .slice(0, 50)
    }, [
      profiles,
      profileSearch,
    ])

  const profileById =
    useMemo(
      () =>
        new Map(
          profiles.map(
            (profile) => [
              profile.id,
              profile,
            ],
          ),
        ),
      [profiles],
    )

  const heroFeaturedCount =
    useMemo(
      () =>
        shots.filter(
          (shot) =>
            shot.heroFeatured,
        ).length,
      [shots],
    )

  const handleCreated = (
    shot: AdminGalleryShot,
  ) => {
    setShots((prev) => [
      {
        ...shot,
        heroFeatured: false,
      },
      ...prev,
    ])
  }

  const handleSaved = (
    shot: AdminGalleryShot,
  ) => {
    setShots((prev) =>
      prev.map((item) =>
        item.id === shot.id
          ? {
              ...shot,
              heroFeatured:
                item.heroFeatured,
            }
          : item,
      ),
    )
  }

  const openEdit = (
    shot: GalleryShotWithHero,
  ) => {
    setEditingShot(shot)
    setEditOpen(true)
  }

  const openBinding = (
    shot: GalleryShotWithHero,
  ) => {
    setBindingTarget(shot)
    setProfileSearch('')
    setBindingOpen(true)
  }

  const toggleHeroFeatured =
    async (
      shot: GalleryShotWithHero,
    ) => {
      const nextValue =
        !shot.heroFeatured

      setTogglingHeroIds(
        (previous) => {
          const next =
            new Set(previous)

          next.add(shot.id)

          return next
        },
      )

      try {
        const response =
          await fetch(
            '/api/admin/gallery/hero-featured',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                galleryId:
                  shot.id,

                heroFeatured:
                  nextValue,
              }),
            },
          )

        const result =
          await response
            .json()
            .catch(() => null)

        if (!response.ok) {
          throw new Error(
            result?.error ||
              'Hero 精选状态更新失败',
          )
        }

        setShots((prev) =>
          prev.map((item) =>
            item.id === shot.id
              ? {
                  ...item,
                  heroFeatured:
                    nextValue,
                }
              : item,
          ),
        )

        toast.success(
          nextValue
            ? '已加入 Hero 精选'
            : '已取消 Hero 精选',
        )
      } catch (error) {
        console.error(
          'Gallery hero featured error:',
          error,
        )

        toast.error(
          error instanceof Error
            ? error.message
            : 'Hero 精选状态更新失败',
        )
      } finally {
        setTogglingHeroIds(
          (previous) => {
            const next =
              new Set(previous)

            next.delete(shot.id)

            return next
          },
        )
      }
    }

  const bindProfile =
    async (
      profile:
        GalleryProfileOption,
    ) => {
      if (!bindingTarget) {
        return
      }

      setIsBinding(true)

      try {
        const response =
          await fetch(
            '/api/admin/gallery/profile',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                galleryId:
                  bindingTarget.id,

                profileId:
                  profile.id,
              }),
            },
          )

        const result =
          await response
            .json()
            .catch(() => null)

        if (!response.ok) {
          throw new Error(
            result?.error ||
              '绑定失败',
          )
        }

        const targetAuthor =
          bindingTarget.author
            .trim()
            .replace(/^@+/, '')
            .toLowerCase()

        setShots((prev) =>
          prev.map((shot) => {
            const shotAuthor =
              shot.author
                .trim()
                .replace(/^@+/, '')
                .toLowerCase()

            if (
              shotAuthor !==
              targetAuthor
            ) {
              return shot
            }

            return {
              ...shot,
              profileId:
                profile.id,
              profileSlug:
                profile.profileSlug ??
                undefined,
            }
          }),
        )

        toast.success(
          `已绑定到 ${getProfileName(
            profile,
          )}`,
        )

        setBindingOpen(false)
        setBindingTarget(null)
      } catch (error) {
        console.error(
          'Gallery profile binding error:',
          error,
        )

        toast.error(
          error instanceof Error
            ? error.message
            : '绑定失败，请重试',
        )
      } finally {
        setIsBinding(false)
      }
    }

  const unbindProfile =
    async (
      shot: GalleryShotWithHero,
    ) => {
      setIsBinding(true)

      try {
        const response =
          await fetch(
            '/api/admin/gallery/profile',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                galleryId:
                  shot.id,

                profileId:
                  null,
              }),
            },
          )

        const result =
          await response
            .json()
            .catch(() => null)

        if (!response.ok) {
          throw new Error(
            result?.error ||
              '解除绑定失败',
          )
        }

        const targetAuthor =
          shot.author
            .trim()
            .replace(/^@+/, '')
            .toLowerCase()

        setShots((prev) =>
          prev.map((item) => {
            const itemAuthor =
              item.author
                .trim()
                .replace(/^@+/, '')
                .toLowerCase()

            if (
              itemAuthor !==
              targetAuthor
            ) {
              return item
            }

            return {
              ...item,
              profileId:
                undefined,
              profileSlug:
                undefined,
            }
          }),
        )

        toast.success(
          '已解除作者账号绑定',
        )

        if (
          bindingTarget?.id ===
          shot.id
        ) {
          setBindingTarget({
            ...shot,
            profileId:
              undefined,
            profileSlug:
              undefined,
          })
        }
      } catch (error) {
        console.error(
          'Gallery profile unbind error:',
          error,
        )

        toast.error(
          error instanceof Error
            ? error.message
            : '解除绑定失败，请重试',
        )
      } finally {
        setIsBinding(false)
      }
    }

  const confirmDelete =
    async () => {
      if (!deleteTarget) {
        return
      }

      setIsDeleting(true)

      try {
        const response =
          await fetch(
            '/api/admin/gallery/delete',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                id: deleteTarget.id,
              }),
            },
          )

        const result =
          await readJsonResponse(
            response,
          )

        if (!result.ok) {
          throw new Error(
            result.message ||
              '删除失败',
          )
        }

        setShots((prev) =>
          prev.filter(
            (shot) =>
              shot.id !==
              deleteTarget.id,
          ),
        )

        toast.success(
          '已删除该作品',
        )

        setDeleteTarget(null)
      } catch (error) {
        console.error(
          '[v0] Gallery delete error:',
          error,
        )

        toast.error(
          error instanceof Error
            ? error.message
            : '删除失败，请重试',
        )
      } finally {
        setIsDeleting(false)
      }
    }

  return (
    <div className="min-h-svh bg-background">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-10 pt-20">
        <AdminHeader
          adminEmail={
            adminEmail
          }
          active="gallery"
        />

        <section>
          <h2 className="mb-4 font-display text-sm tracking-[0.15em] text-foreground">
            发布新作品
          </h2>

          <div className="corner-cut border border-border bg-card p-6">
            <GalleryForm
              onCreated={
                handleCreated
              }
            />
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-display text-sm tracking-[0.15em] text-foreground">
              全部作品（
              {sortedShots.length}
              ）
            </h2>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="size-3.5 fill-primary text-primary" />
              Hero 精选：
              <span className="font-medium text-foreground">
                {
                  heroFeaturedCount
                }
              </span>
            </div>
          </div>

          <div className="corner-cut border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">
                    封面
                  </TableHead>

                  <TableHead>
                    标题
                  </TableHead>

                  <TableHead>
                    作者
                  </TableHead>

                  <TableHead>
                    酒馆账号
                  </TableHead>

                  <TableHead>
                    分类
                  </TableHead>

                  <TableHead>
                    日期
                  </TableHead>

                  <TableHead>
                    点赞
                  </TableHead>

                  <TableHead className="text-center">
                    Hero 精选
                  </TableHead>

                  <TableHead className="text-right">
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sortedShots.length ===
                  0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      暂无作品，请使用上方表单发布第一张作品
                    </TableCell>
                  </TableRow>
                )}

                {sortedShots.map(
                  (shot) => {
                    const boundProfile =
                      shot.profileId
                        ? profileById.get(
                            shot.profileId,
                          )
                        : undefined

                    const isHeroBusy =
                      togglingHeroIds.has(
                        shot.id,
                      )

                    return (
                      <TableRow
                        key={
                          shot.id
                        }
                      >
                        <TableCell>
                          <div className="relative h-12 w-16 overflow-hidden rounded-sm bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={
                                shot.src ||
                                '/placeholder.svg'
                              }
                              alt={
                                shot.alt
                              }
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          </div>
                        </TableCell>

                        <TableCell className="max-w-55 truncate whitespace-nowrap font-medium text-foreground">
                          {
                            shot.caption
                          }
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {
                            shot.author
                          }
                        </TableCell>

                        <TableCell>
                          {boundProfile ? (
                            <div className="flex min-w-40 flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="border-primary/30 text-primary"
                                >
                                  已绑定
                                </Badge>

                                <span className="max-w-32 truncate text-xs font-medium text-foreground">
                                  {getProfileName(
                                    boundProfile,
                                  )}
                                </span>

                                {boundProfile.profileSlug ? (
                                  <Link
                                    href={`/profile/${encodeURIComponent(
                                      boundProfile.profileSlug,
                                    )}`}
                                    target="_blank"
                                    title="查看个人主页"
                                    className="text-muted-foreground transition-colors hover:text-primary"
                                  >
                                    <ExternalLink className="size-3.5" />
                                  </Link>
                                ) : null}
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openBinding(
                                      shot,
                                    )
                                  }
                                  className="text-[0.68rem] text-muted-foreground transition-colors hover:text-primary"
                                >
                                  更换
                                </button>

                                <span className="text-border">
                                  /
                                </span>

                                <button
                                  type="button"
                                  disabled={
                                    isBinding
                                  }
                                  onClick={() =>
                                    unbindProfile(
                                      shot,
                                    )
                                  }
                                  className="text-[0.68rem] text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                                >
                                  解除
                                </button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openBinding(
                                  shot,
                                )
                              }
                              className="gap-2"
                            >
                              <Link2 className="size-3.5" />

                              绑定账号
                            </Button>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline">
                            {
                              GALLERY_CATEGORY_LABEL[
                                shot
                                  .category
                              ]
                            }
                          </Badge>
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {
                            shot.publishedAt
                          }
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {
                            shot.likes
                          }
                        </TableCell>

                        <TableCell className="text-center">
                          <button
                            type="button"
                            disabled={
                              isHeroBusy
                            }
                            onClick={() =>
                              toggleHeroFeatured(
                                shot,
                              )
                            }
                            title={
                              shot.heroFeatured
                                ? '取消 Hero 精选'
                                : '加入 Hero 精选'
                            }
                            aria-label={
                              shot.heroFeatured
                                ? '取消 Hero 精选'
                                : '加入 Hero 精选'
                            }
                            className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-background transition-all hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Star
                              className={
                                shot.heroFeatured
                                  ? 'size-4 fill-primary text-primary'
                                  : 'size-4 text-muted-foreground'
                              }
                            />
                          </button>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openEdit(
                                  shot,
                                )
                              }
                            >
                              编辑
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                setDeleteTarget(
                                  shot,
                                )
                              }
                            >
                              删除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  },
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </main>

      <GalleryEditDialog
        shot={
          editingShot
        }
        open={
          editOpen
        }
        onOpenChange={
          setEditOpen
        }
        onSaved={
          handleSaved
        }
      />

      <Dialog
        open={
          bindingOpen
        }
        onOpenChange={(
          open,
        ) => {
          setBindingOpen(
            open,
          )

          if (!open) {
            setBindingTarget(
              null,
            )

            setProfileSearch(
              '',
            )
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              绑定酒馆账号
            </DialogTitle>

            <DialogDescription>
              为《
              {
                bindingTarget?.caption
              }
              》的作者「
              {
                bindingTarget?.author
              }
              」选择对应的 StarClub 用户。
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={
                profileSearch
              }
              onChange={(
                event,
              ) =>
                setProfileSearch(
                  event.target
                    .value,
                )
              }
              placeholder="搜索用户名、显示名或 Star Citizen Handle..."
              className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              autoFocus
            />
          </div>

          {bindingTarget
            ?.profileId ? (
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  当前绑定
                </p>

                <p className="mt-1 text-sm font-medium text-foreground">
                  {profileById.has(
                    bindingTarget.profileId,
                  )
                    ? getProfileName(
                        profileById.get(
                          bindingTarget.profileId,
                        )!,
                      )
                    : bindingTarget.profileId}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={
                  isBinding
                }
                onClick={() =>
                  unbindProfile(
                    bindingTarget,
                  )
                }
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Unlink className="size-3.5" />

                解除绑定
              </Button>
            </div>
          ) : null}

          <div className="max-h-105 overflow-y-auto rounded-md border border-border">
            {filteredProfiles.length ===
            0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                没有找到匹配的用户
              </div>
            ) : (
              filteredProfiles.map(
                (profile) => {
                  const selected =
                    bindingTarget?.profileId ===
                    profile.id

                  return (
                    <button
                      key={
                        profile.id
                      }
                      type="button"
                      disabled={
                        isBinding ||
                        selected
                      }
                      onClick={() =>
                        bindProfile(
                          profile,
                        )
                      }
                      className="flex w-full items-center justify-between gap-5 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/50 disabled:cursor-default disabled:opacity-60"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {getProfileName(
                            profile,
                          )}
                        </p>

                        {getProfileSubline(
                          profile,
                        ) ? (
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {getProfileSubline(
                              profile,
                            )}
                          </p>
                        ) : null}
                      </div>

                      {selected ? (
                        <Badge
                          variant="outline"
                          className="shrink-0 border-primary/30 text-primary"
                        >
                          当前绑定
                        </Badge>
                      ) : (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          选择
                        </span>
                      )}
                    </button>
                  )
                },
              )
            )}
          </div>

          <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
            这里只进行人工绑定，不会根据作者名称自动匹配用户。
          </p>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(
          deleteTarget,
        )}
        onOpenChange={(
          open,
        ) => {
          if (!open) {
            setDeleteTarget(
              null,
            )
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              删除作品
            </AlertDialogTitle>

            <AlertDialogDescription>
              确定要删除《
              {
                deleteTarget?.caption
              }
              》吗？此操作会从数据库中移除该记录，且无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={
                isDeleting
              }
            >
              取消
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={
                confirmDelete
              }
              disabled={
                isDeleting
              }
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting
                ? '删除中...'
                : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}