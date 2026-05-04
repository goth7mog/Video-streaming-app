# STEPS

1. Run `terraform apply` (the droplet's IP will be written to `ansible/vault.yaml` automatically).


2. SSH into your DigitalOcean droplet:

<!-- Wait for 1min for the droplet initialisation -->

```
cd terraform

ssh -i /Users/alexander/.ssh/DigitalOcean/main main@"$(terraform output -raw droplet_ip | tr -d '\r\n' | sed -E 's/[^0-9.]//g')"
```

3. provision with Ansible:

```
cd ansible

ansible-playbook -i inventory.yaml site.yaml -l droplet1-main
```
<!-- If stalls at the Install Docker task, interrupt and try again -->

4. Link the DNS name with the droplet's ip.


5. Apply the rest of K3S manifests ultimately:
```
export $(cat k3s/variables.env | xargs)

envsubst < k3s/letsencrypt-clusterissuer.yaml | sudo k3s kubectl apply -f -
envsubst < k3s/app-certificate.yaml | sudo k3s kubectl apply -f -
envsubst < k3s/app-ingress.yaml | sudo k3s kubectl apply -f -

sudo k3s kubectl apply -f k3s/nfs-pv-pvc.yaml -f k3s/app-configmap.yaml -f k3s/app-deployment.yaml -f k3s/app-service.yaml
```


## Destroying the Droplet and Cleaning SSH Known Hosts

To destroy your droplet and remove its SSH key from known_hosts (to avoid SSH warnings when recreating):

```
terraform destroy
ssh-keygen -R "$ip"
```