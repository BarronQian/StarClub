'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  computeHangarState,
  listUpcomingWindows,
  CLOSED_MS,
} from '@/lib/executive-hangar'
import {
  executiveHangarConfig as cfg,
  type HangarTimezoneId,
} from '@/lib/executive-hangar-config'

import { HangarInstrument } from './hangar-instrument'
import { NextOpen } from './next-open'
import { CycleExplanation } from './cycle-explanation'
import { UpcomingWindows } from './upcoming-windows'
import { CalibrationPanel } from './calibration-panel'

const DEFAULT_ANCHOR =
  new Date(cfg.anchorTime).getTime()

export function ExecutiveHangarTool() {
  const [
    anchor,
    setAnchor,
  ] = useState(DEFAULT_ANCHOR)

  const [
    timezone,
    setTimezone,
  ] =
    useState<HangarTimezoneId>(
      'local',
    )

  const [
    now,
    setNow,
  ] =
    useState<number | null>(
      null,
    )

  useEffect(() => {
    setNow(Date.now())

    const id =
      window.setInterval(
        () =>
          setNow(
            Date.now(),
          ),
        1000,
      )

    return () =>
      window.clearInterval(
        id,
      )
  }, [])

  const state =
    useMemo(
      () =>
        now === null
          ? null
          : computeHangarState(
              now,
              anchor,
            ),
      [
        now,
        anchor,
      ],
    )

  const windows =
    useMemo(
      () =>
        state &&
        now !== null
          ? listUpcomingWindows(
              state,
              now,
              5,
            )
          : [],
      [
        state,
        now,
      ],
    )

  return (
    <div className="flex flex-col gap-10">
      <HangarInstrument
        state={state}
        anchor={anchor}
        now={now}
      />

      {state && (
        <NextOpen
          nextOpen={
            state.nextOpen
          }
          untilNextOpen={
            state.untilNextOpen
          }
          isOpenNow={
            state.phase ===
            'open'
          }
        />
      )}

      <CycleExplanation />

      {windows.length >
        0 &&
        now !== null && (
          <UpcomingWindows
            windows={
              windows
            }
            now={now}
            timezone={
              timezone
            }
            onTimezoneChange={
              setTimezone
            }
          />
        )}

      <CalibrationPanel
        anchor={anchor}
        onCalibrate={(
          greenStart,
        ) =>
          setAnchor(
            greenStart -
              CLOSED_MS,
          )
        }
        onReset={() =>
          setAnchor(
            DEFAULT_ANCHOR,
          )
        }
      />
    </div>
  )
}
