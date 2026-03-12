import json

# Target groups
with open('tg_list.json') as f:
    tgs = json.load(f)['TargetGroups']

# ARNs
tg_map = {}
for tg in tgs:
    tg_map[tg['TargetGroupName']] = tg['TargetGroupArn']

# Certs
with open('cert_list_3.json') as f:
    certs = json.load(f)['CertificateSummaryList']

cert_map = {}
for cert in certs:
    # Use the first one found if duplicates exist
    if cert['DomainName'] not in cert_map:
        cert_map[cert['DomainName']] = cert['CertificateArn']

print("echo 'Setting up ALB HTTPs listener...'")
alb_arn = "arn:aws:elasticloadbalancing:ap-southeast-1:194442925745:loadbalancer/app/budol-ecosystem-alb/b73674a78422ba42"

actions = []
conditions = []

# Choose budolshap as the default cert
default_cert = cert_map['budolshap.duckdns.org']

def create_rule(domain, tg_name, priority):
    global alb_arn
    arn = tg_map[tg_name]
    cmd = (
        f"aws elbv2 create-rule --listener-arn LISTENER_ARN "
        f"--priority {priority} --conditions Field=host-header,Values={domain} "
        f"--actions Type=forward,TargetGroupArn={arn} > rule_{priority}.json"
    )
    return cmd

# First, create the listener with default cert and default rule to go to budolshap-tg
cmd_listen = (
    f"aws elbv2 create-listener --load-balancer-arn {alb_arn} --protocol HTTPS --port 443 "
    f"--certificates CertificateArn={default_cert} "
    f"--default-actions Type=forward,TargetGroupArn={tg_map['budolshap-tg']} > listener.json"
)

# rules
rules = []
rules.append(create_rule('budolpay.duckdns.org', 'budolpay-tg', 10))
rules.append(create_rule('budolid.duckdns.org', 'budolid-tg', 20))
rules.append(create_rule('budolaccounting.duckdns.org', 'budolaccounting-tg', 30))
rules.append(create_rule('budolws.duckdns.org', 'budolws-tg', 40))
rules.append(create_rule('budoladmin.duckdns.org', 'budoladmin-tg', 50))

# additional certs snippet
extra_certs = []
for domain, arn in cert_map.items():
    if domain != 'budolshap.duckdns.org':
        extra_certs.append(f"CertificateArn={arn}")

cmd_extra_certs = (
    f"aws elbv2 add-listener-certificates --listener-arn LISTENER_ARN "
    f"--certificates " + " ".join(extra_certs)
)

print(cmd_listen)

# Create script
with open('run_alb_setup.bat', 'w') as out:
    out.write(cmd_listen + "\n")
    out.write('for /f "tokens=* usebackq" %%a in (`powershell "(Get-Content listener.json | ConvertFrom-Json).Listeners[0].ListenerArn"`) do set L_ARN=%%a\n')
    for r in rules:
        out.write(r.replace("LISTENER_ARN", "%L_ARN%") + "\n")
    out.write(cmd_extra_certs.replace("LISTENER_ARN", "%L_ARN%") + "\n")
