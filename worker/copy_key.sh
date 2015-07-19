KEY=$1
if ! grep -Fxq "$KEY" ~/.ssh/authorized_keys; then 
    echo $KEY >> /root/.ssh/authorized_keys; 
    echo key added.; 
fi;
