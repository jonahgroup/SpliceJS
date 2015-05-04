xcopy ..\source\www www\ /e /y
xcopy ..\..\..\splicejs www\js\splicejs\ /e /y
call cordova build
rem call cordova emulate android
