# STEPS

1. Run `terraform apply` (the droplet's IP will be written to `ansible/vault.yaml` automatically).


2. SSH into your DigitalOcean droplet:

<!-- Wait for 1min for the droplet initialisation -->

```
cd terraform

ssh -i /Users/alexander/.ssh/DigitalOcean/main main@"$(terraform output -raw droplet_ip | tr -d '\r\n' | sed -E 's/[^0-9.]//g')"
```

3. provision with Ansible (phase 1):

```
cd ansible

ansible-playbook -i inventory.yaml phase-1.yaml -l droplet1-main
```
<!-- If stalls at the Install Docker task, interrupt and try again -->

4. Link the DNS name with the droplet's ip.


5. After the DNS name points to the new droplet IP, continue with the phase 2:
```
cd ansible

ansible-playbook -i inventory.yaml phase-2.yaml -l droplet1-main
```


## Destroying the Droplet and Cleaning SSH Known Hosts

To destroy your droplet and remove its SSH key from known_hosts (to avoid SSH warnings when recreating):

```
terraform destroy
ssh-keygen -R "$ip"
```