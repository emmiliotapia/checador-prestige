Set WshShell = CreateObject("WScript.Shell")
' El parámetro 0 al final oculta la ventana de comandos por completo
WshShell.Run "cmd.exe /c silent_start.bat", 0, False
Set WshShell = Nothing
