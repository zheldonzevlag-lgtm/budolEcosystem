import os

cmd = """aws elbv2 modify-listener --listener-arn arn:aws:elasticloadbalancing:ap-southeast-1:194442925745:listener/app/budol-ecosystem-alb/b73674a78422ba42/499bc6ce51248ca6 --default-actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port='443',Host='#{host}',Path='/#{path}',Query='#{query}',StatusCode=HTTP_301}" """
os.system(cmd)
