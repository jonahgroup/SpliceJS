call cordova create MobileExample org.splicejs.mobileexample MobileExample
call cd MobileExample
call cordova platform add android

call cd ..

xcopy source\www MobileExample\www\ /e /y
xcopy .\source\build.bat MobileExample\
rem xcopy ..\..\splicejs MobileExample\www\js\splicejs\ /e /y

cd .\MobileExample

call build
