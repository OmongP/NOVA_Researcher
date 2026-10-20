# Windows 에서 UX Lens 서버(npm run share)를 로그인할 때 자동으로 켜고, 잠자기를 꺼요.
#   등록:  PowerShell 에서 프로젝트 폴더로 이동해  .\scripts\windows-autostart.ps1
#   해제:  .\scripts\windows-autostart.ps1 -Remove
# 로그는 프로젝트 폴더의 share.log 에 쌓여요. 이 PC에 Claude Code 로그인이 돼 있는 사용자 계정으로 등록해요.
param([switch]$Remove, [switch]$KeepSleepSettings)

$TaskName = 'UX-Lens-Share'

if ($Remove) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "작업 '$TaskName' 을 해제했어요."
  exit 0
}

$Project = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$Npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$Log = Join-Path $Project 'share.log'

# cmd.exe 로 실행해서 출력과 오류를 share.log 에 남겨요.
$Command = "cd /d `"$Project`" && `"$Npm`" run share >> `"$Log`" 2>&1"
$Action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/c $Command"
$Trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$Settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable `
  -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
$Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Force | Out-Null
Write-Host "작업 '$TaskName' 을 등록했어요. 다음 로그인부터 자동으로 켜져요. (지금 바로 켜려면: Start-ScheduledTask -TaskName $TaskName)"

if (-not $KeepSleepSettings) {
  # 전원에 연결돼 있을 때 잠자기·최대 절전을 꺼요(화면 꺼짐은 그대로 둬요).
  powercfg /change standby-timeout-ac 0
  powercfg /change hibernate-timeout-ac 0
  Write-Host '전원 연결 시 잠자기·최대 절전을 껐어요. (되돌리려면 설정 > 시스템 > 전원에서 변경)'
}
Write-Host "로그: $Log"
