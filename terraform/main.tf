# main.tf
# Terraform configuration for deploying a DigitalOcean Droplet

terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.digitalocean_token
}

resource "digitalocean_droplet" "web" {
  name   = "videohosting"
  region = "ams3"        # Amsterdam region
  size   = "s-1vcpu-1gb" # 512 MiB, 1 vCPU, $4/month (`s-1vcpu-512mb-10gb`);   1 GiB, 1 vCPU, $6/month (`s-1vcpu-1gb`);   2 GiB, 1 vCPU, $12/month (`s-1vcpu-2gb`)
  image  = "ubuntu-22-04-x64"

  ssh_keys = [
    var.root_ssh_fingerprint
  ]

  user_data = templatefile("${path.module}/cloud-init.yaml", {
    ssh_public_key     = var.ssh_public_key,
    main_user_password = var.main_user_password
  })

  provisioner "local-exec" {
    command = "sed -E -i '' 's|^droplet1_ip: \".*\"$|droplet1_ip: \"${self.ipv4_address}\"|' ${abspath("${path.module}/../ansible/vault.yaml")}"
  }
}

output "droplet_ip" {
  value = digitalocean_droplet.web.ipv4_address
}
