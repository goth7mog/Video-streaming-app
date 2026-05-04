# Setup

1. Run `terraform apply` (the droplet's IP will be written to `ansible/vault.yaml` automatically).


2. SSH into your DigitalOcean droplet:

<!-- Wait for 1min for the droplet initialisation -->
```
ssh -i /Users/alexander/.ssh/DigitalOcean/main main@$(terraform output -raw droplet_ip)
```

3. provision with Ansible:

```
ansible-playbook -i inventory.yaml site.yaml -l droplet1-main
```



## Destroying the Droplet and Cleaning SSH Known Hosts

To destroy your droplet and remove its SSH key from known_hosts (to avoid SSH warnings when recreating):

```
terraform destroy
ssh-keygen -R $(terraform output -raw droplet_ip)
```