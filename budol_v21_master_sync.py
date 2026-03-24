import boto3
import json
import os

SERVICES = [
    {"name": "budol-auth", "task": "budolpay-auth-task", "sd_arn": "arn:aws:servicediscovery:ap-southeast-1:194442925745:service/srv-ytse5nnq2k4sgvoy"},
    {"name": "budol-id", "task": "budol-id-task", "sd_arn": "arn:aws:servicediscovery:ap-southeast-1:194442925745:service/srv-muzrn7ehpf6v3nho"},
    {"name": "budol-pay", "task": "budolpay-payment-task", "sd_arn": "arn:aws:servicediscovery:ap-southeast-1:194442925745:service/srv-cy24imvnqjsu4rgg"}, 
    {"name": "budol-shap", "task": "budol-shap-task", "tg_arn": "arn:aws:elasticloadbalancing:ap-southeast-1:194442925745:targetgroup/budolshap-tg/f3979cc0cc2db733", "port": 3001, "sd_arn": "arn:aws:servicediscovery:ap-southeast-1:194442925745:service/srv-kraki774m2j7ymyw"},
    {"name": "budolpay-gateway", "task": "budolpay-gateway-task", "tg_arn": "arn:aws:elasticloadbalancing:ap-southeast-1:194442925745:targetgroup/budolpay-tg/1996e5f2c88896a8", "port": 8000, "sd_arn": "arn:aws:servicediscovery:ap-southeast-1:194442925745:service/srv-2fhe66vkusihs4xk"},
    {"name": "budolpay-admin", "task": "budolpay-admin-task", "tg_arn": "arn:aws:elasticloadbalancing:ap-southeast-1:194442925745:targetgroup/budoladmin-tg/4e020ee5ddc2398f", "port": 3000, "sd_arn": "arn:aws:servicediscovery:ap-southeast-1:194442925745:service/srv-o45eelltavmgi6py"},
    {"name": "budolpay-wallet", "task": "budolpay-wallet-task", "sd_arn": "arn:aws:servicediscovery:ap-southeast-1:194442925745:service/srv-adidpqgoiszw5mnn"},
    {"name": "budolpay-transaction", "task": "budolpay-transaction-task", "sd_arn": "arn:aws:servicediscovery:ap-southeast-1:194442925745:service/srv-rvovdtbd5cxk37xi"},
    {"name": "budolpay-websocket", "task": "budolpay-websocket-task", "sd_arn": "arn:aws:servicediscovery:ap-southeast-1:194442925745:service/srv-ht76pruqpdryyzu2"},
    {"name": "budol-accounting", "task": "budol-accounting-task", "sd_arn": "arn:aws:servicediscovery:ap-southeast-1:194442925745:service/srv-g7vhdwri33q56n7b"},
    {"name": "budolpay-kyc", "task": "budolpay-kyc-task", "sd_arn": "arn:aws:servicediscovery:ap-southeast-1:194442925745:service/srv-wp5ho2dshlqtqudu"},
    {"name": "budolpay-settlement", "task": "budolpay-settlement-task", "sd_arn": "arn:aws:servicediscovery:ap-southeast-1:194442925745:service/srv-7kmwmxbcrwzetbbe"},
    {"name": "budolpay-mobile", "task": "budolpay-mobile-task", "sd_arn": "arn:aws:servicediscovery:ap-southeast-1:194442925745:service/srv-qfofwueoxr2466vk"}
]

CLUSTER = 'budol-ecosystem-cluster'
REGION = 'ap-southeast-1'

ecs = boto3.client('ecs', region_name=REGION)

def get_live_networking():
    print("Fetching live networking config from budol-id-service...")
    try:
        resp = ecs.describe_services(cluster=CLUSTER, services=['budol-id-service'])
        conf = resp['services'][0]['networkConfiguration']['awsvpcConfiguration']
        return conf['subnets'], conf['securityGroups']
    except Exception as e:
        print(f"Failed to fetch dynamic networking: {str(e)}")
        # Fallback to screenshot IDs
        return ["subnet-07964641998ecf32f", "subnet-0dff713a9f3776f78", "subnet-09034f591a2e8ef12", "subnet-040f9b98f6ce38533"], ["sg-0ce5df1ba5bd90a2c"]

import time

def launch_ecosystem():
    subnets, sgs = get_live_networking()
    print(f"Subnets: {subnets}, SGs: {sgs}")
    for f_svc in SERVICES:
        svc_name = f"{f_svc['name']}-service"
        print(f"--- Processing {svc_name} ---")
        filename = f"{f_svc['task']}.json"
        if not os.path.exists(filename): continue
        with open(filename, "r") as f:
            td = json.load(f)
        try:
            reg = ecs.register_task_definition(
                family=f_svc['task'], executionRoleArn=td['executionRoleArn'],
                taskRoleArn=td['taskRoleArn'], networkMode='awsvpc',
                requiresCompatibilities=['FARGATE'], cpu=td['cpu'], memory=td['memory'],
                containerDefinitions=td['containerDefinitions']
            )['taskDefinition']['taskDefinitionArn']
            # Clean recreation to support serviceRegistries (which are immutable)
            try:
                ecs.update_service(cluster=CLUSTER, service=svc_name, desiredCount=0)
                ecs.delete_service(cluster=CLUSTER, service=svc_name, force=True)
                print(f"Deleted existing {svc_name}. Waiting for draining...")
                time.sleep(15)
            except: pass

            params = {
                'cluster': CLUSTER,
                'serviceName': svc_name,
                'taskDefinition': reg,
                'desiredCount': 1,
                'launchType': 'FARGATE',
                'networkConfiguration': {
                    'awsvpcConfiguration': {
                        'subnets': subnets,
                        'securityGroups': sgs,
                        'assignPublicIp': 'ENABLED'
                    }
                }
            }
            if 'tg_arn' in f_svc:
                params['loadBalancers'] = [{
                    'targetGroupArn': f_svc['tg_arn'],
                    'containerName': f_svc['name'],
                    'containerPort': f_svc['port']
                }]
            if 'sd_arn' in f_svc:
                params['serviceRegistries'] = [{'registryArn': f_svc['sd_arn']}]
            
            # Retry loop for creation
            for i in range(5):
                try:
                    ecs.create_service(**params)
                    print(f"Successfully created {svc_name}")
                    break
                except Exception as e:
                    if "Draining" in str(e):
                        print(f"Still draining. Retrying {i+1}/5...")
                        time.sleep(20)
                    else:
                        raise e
        except Exception as e: print(f"Error {svc_name}: {str(e)}")

if __name__ == "__main__":
    launch_ecosystem()
