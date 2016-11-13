$OutDir = '.'
$command = @'
nuget pack nuspec\splicejs.nuspec -OutputDir $OutDir
'@

Invoke-Expression -Command:$command

