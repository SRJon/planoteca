dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=opencover


dotnet tool install -g dotnet-reportgenerator-globaltool

reportgenerator -reports:"coverage.xml" -targetdir:"report" -reporttypes:HtmlInline 