KEY=$1 
if [ -z "$( grep "$KEY" ~/.ssh/authorized_keys )" ]; then 
	echo $KEY >> ~/.ssh/authorized_keys; 
	echo key added.; 
fi;