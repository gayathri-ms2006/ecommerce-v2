@echo off
echo Importing Lambda Permissions...
terraform import aws_lambda_permission.apigw_lambda[\"product_item\"] productservice/cdc15a0f-3b49-5070-bb57-f91daaa00fb9
terraform import aws_lambda_permission.apigw_lambda[\"product_root\"] productservice/81a0f6cf-7909-5bb4-aa7b-d8b66980845b

terraform import aws_lambda_permission.apigw_lambda[\"cart_root\"] cartservice/748e5bcb-283a-526d-a947-0604a051757b
terraform import aws_lambda_permission.apigw_lambda[\"cart_user\"] cartservice/cf7d315a-d58a-5fd7-bda2-af5cec481172

terraform import aws_lambda_permission.apigw_lambda[\"inventory_item\"] inventoryservice/3770d800-f91f-51f6-9ea4-a2a2db0cffc0
terraform import aws_lambda_permission.apigw_lambda[\"inventory_root\"] inventoryservice/571dcc3e-42cc-5d36-aa9e-bf44d7eec6f5
terraform import aws_lambda_permission.apigw_lambda[\"inventory_item_avail\"] inventoryservice/531eb988-6668-51f7-9e5a-43db52c57c9e
terraform import aws_lambda_permission.apigw_lambda[\"inventory_item_reduce\"] inventoryservice/45c7e532-9e88-5991-a196-bdd4f158bd0c
terraform import aws_lambda_permission.apigw_lambda[\"inventory_avail\"] inventoryservice/17ff50c2-28d8-5ee3-a9e6-756f0b39691a
terraform import aws_lambda_permission.apigw_lambda[\"inventory_reduce\"] inventoryservice/1f9aec1f-3785-51e1-b46d-0db53dc56ef5

terraform import aws_lambda_permission.apigw_lambda[\"wishlist_root\"] wishlist/1c6f440c-3183-5aa9-ae51-d1c0da7235a2
terraform import aws_lambda_permission.apigw_lambda[\"wishlist_item\"] wishlist/dc63bbb7-058a-5cab-923c-ad6d116cea28
terraform import aws_lambda_permission.apigw_lambda[\"wishlist_check\"] wishlist/9a885037-4ea7-5d70-b51b-9f2293f6d1c9

terraform import aws_lambda_permission.apigw_lambda[\"payment_root\"] paymentservice/2b16c30a-8b78-510d-adf8-d5febd117525
terraform import aws_lambda_permission.apigw_lambda[\"payment_item\"] paymentservice/bb4865e8-b16f-5d31-adc5-14a10efbd239
terraform import aws_lambda_permission.apigw_lambda[\"payment_status\"] paymentservice/dc8a4efe-d8ed-59f3-a6d9-ee873d893c32
terraform import aws_lambda_permission.apigw_lambda[\"payment_refund\"] paymentservice/a240e1db-079e-50d4-9dab-b788cb269e6f

terraform import aws_lambda_permission.apigw_lambda[\"order_item\"] orderservice/9ad665d2-56c3-535b-bcad-7148e311141f
terraform import aws_lambda_permission.apigw_lambda[\"order_root\"] orderservice/934ad409-4f30-5268-9fed-5dc37509c12c
terraform import aws_lambda_permission.apigw_lambda[\"order_item_cancel\"] orderservice/7aaae066-ecbc-5ec8-8b72-61cbbfaf7428
terraform import aws_lambda_permission.apigw_lambda[\"order_item_track\"] orderservice/d1a1d2b4-5c46-52aa-aa26-761ae403a317
terraform import aws_lambda_permission.apigw_lambda[\"order_track\"] orderservice/999ffdc3-e466-5e35-bfad-fba4a2e3afe4
terraform import aws_lambda_permission.apigw_lambda[\"order_cancel\"] orderservice/5022e9f6-0a9d-5b3b-8d13-84d91ed05153
