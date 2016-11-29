param(
[string]$outdir = '.'
)

$command = @'
nuget pack nuspec\splicejs.nuspec -OutputDir $outdir
'@

Invoke-Expression -Command:$command

