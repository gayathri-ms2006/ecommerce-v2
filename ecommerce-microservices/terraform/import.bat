@echo off
echo Importing Integrations...
terraform import aws_apigatewayv2_integration.services[\"wishlist\"] wqh563y9sj/068774j
terraform import aws_apigatewayv2_integration.services[\"cart\"] wqh563y9sj/bekow87
terraform import aws_apigatewayv2_integration.services[\"inventory\"] wqh563y9sj/4duxqeg
terraform import aws_apigatewayv2_integration.services[\"order\"] wqh563y9sj/7qzhy90
terraform import aws_apigatewayv2_integration.services[\"product_root\"] wqh563y9sj/d8vzd7n
terraform import aws_apigatewayv2_integration.services[\"product_item\"] wqh563y9sj/cocot0b
terraform import aws_apigatewayv2_integration.services[\"payment_root\"] wqh563y9sj/xy8vj3q
terraform import aws_apigatewayv2_integration.services[\"payment_item\"] wqh563y9sj/s7mkuvh
terraform import aws_apigatewayv2_integration.services[\"payment_status\"] wqh563y9sj/ly2s8xq
terraform import aws_apigatewayv2_integration.services[\"payment_refund\"] wqh563y9sj/cbbucrs

echo Importing Routes...
terraform import aws_apigatewayv2_route.routes[\"cart_put\"] wqh563y9sj/3q9t3is
terraform import aws_apigatewayv2_route.routes[\"order_post\"] wqh563y9sj/4gjiolm
terraform import aws_apigatewayv2_route.routes[\"inventory_avail\"] wqh563y9sj/4xjbq7j
terraform import aws_apigatewayv2_route.routes[\"payment_status\"] wqh563y9sj/69f8t1t
terraform import aws_apigatewayv2_route.routes[\"order_get_id\"] wqh563y9sj/7dmtsq6
terraform import aws_apigatewayv2_route.routes[\"cart_post\"] wqh563y9sj/8cbemeg
terraform import aws_apigatewayv2_route.routes[\"order_cancel\"] wqh563y9sj/9omtr67
terraform import aws_apigatewayv2_route.routes[\"wishlist_delete_item\"] wqh563y9sj/evf9szs
terraform import aws_apigatewayv2_route.routes[\"wishlist_check_item\"] wqh563y9sj/hxcqhcc
terraform import aws_apigatewayv2_route.routes[\"inventory_put\"] wqh563y9sj/kg9rkzh
terraform import aws_apigatewayv2_route.routes[\"payment_refund\"] wqh563y9sj/mqtmj3f
terraform import aws_apigatewayv2_route.routes[\"payment_root\"] wqh563y9sj/nfqorht
terraform import aws_apigatewayv2_route.routes[\"inventory_get\"] wqh563y9sj/oqe1fy0
terraform import aws_apigatewayv2_route.routes[\"order_get\"] wqh563y9sj/po86tnc
terraform import aws_apigatewayv2_route.routes[\"inventory_reduce_post\"] wqh563y9sj/pw6bikq
terraform import aws_apigatewayv2_route.routes[\"product_item\"] wqh563y9sj/qctf9t3
terraform import aws_apigatewayv2_route.routes[\"wishlist_get\"] wqh563y9sj/rrm140a
terraform import aws_apigatewayv2_route.routes[\"cart_delete\"] wqh563y9sj/ruc57sl
terraform import aws_apigatewayv2_route.routes[\"order_track\"] wqh563y9sj/trnjlef
terraform import aws_apigatewayv2_route.routes[\"cart_get_id\"] wqh563y9sj/w6pv8dt
terraform import aws_apigatewayv2_route.routes[\"wishlist_post\"] wqh563y9sj/yg6ihzj
terraform import aws_apigatewayv2_route.routes[\"product_root\"] wqh563y9sj/zay6rc2
terraform import aws_apigatewayv2_route.routes[\"payment_item\"] wqh563y9sj/zi9ptr7
terraform import aws_apigatewayv2_route.routes[\"inventory_reduce_id\"] wqh563y9sj/zvwmbf3
terraform import aws_apigatewayv2_route.routes[\"inventory_get_id\"] wqh563y9sj/zydldw0
