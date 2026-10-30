FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["XiangqiBackend.csproj", "./"]
RUN dotnet restore "XiangqiBackend.csproj"

COPY . .
RUN dotnet publish "XiangqiBackend.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5235
EXPOSE 5235

ENTRYPOINT ["dotnet", "XiangqiBackend.dll"]

