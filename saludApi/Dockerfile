FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

COPY saludApi/saludApi.csproj ./
RUN dotnet restore

COPY saludApi/. ./
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out ./
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "saludApi.dll"]