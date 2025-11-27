# Deployment Guide

## Azure Resource Setup

```bash
# Variables
RESOURCE_GROUP="rg-claude-automation-test-prod"
WEB_APP_NAME="app-claude-automation-test-prod"

# Login and set subscription
az login
az account set --subscription "Snowlion - Internal Use Only"

# Create Resource Group
az group create --name $RESOURCE_GROUP --location norwayeast

# Create App Service Plan
az appservice plan create \
  --name asp-claude-automation-test-prod \
  --resource-group $RESOURCE_GROUP \
  --sku B1 --is-linux

# Create Web App
az webapp create \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan asp-claude-automation-test-prod \
  --runtime "NODE:20-lts"
```

## IP Whitelist

```bash
MY_IP=$(curl -s ifconfig.me)
az webapp config access-restriction add \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --rule-name "AllowMyIP" \
  --priority 100 \
  --ip-address "$MY_IP/32" \
  --action Allow
```

## GitHub Secrets

Add to repo settings > Secrets:
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID` 
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_WEBAPP_NAME` = `app-claude-automation-test-prod`
