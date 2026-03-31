import { systemPreferences, shell } from 'electron'

export function checkScreenPermission(): 'granted' | 'denied' | 'restricted' | 'unknown' | 'not-determined' {
  return systemPreferences.getMediaAccessStatus('screen') as
    | 'granted'
    | 'denied'
    | 'restricted'
    | 'unknown'
    | 'not-determined'
}

export function openScreenPrivacyPrefs(): void {
  shell.openExternal(
    'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture'
  )
}
