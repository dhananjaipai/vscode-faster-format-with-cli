packer {
  required_plugins {
    amazon = {
            source  = "github.com/hashicorp/amazon"
      version = "~> 1"
    }
  }
}







source "amazon-ebs" "example" {
  assume_role {
    role_arn     = "arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME"
    session_name = "SESSION_NAME"
    external_id  = "EXTERNAL_ID"
  }
}



