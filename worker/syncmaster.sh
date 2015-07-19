SLAVE=$1
MASTER=$2
sed '/master/d' /etc/hosts > /etc/hosts
echo $MASTER " master" >> /etc/hosts
echo $MASTER 'euca-'`echo $MASTER | sed 's/\./-/g'`'.eucalyptus.internal' >> /etc/hosts
ssh root@$SLAVE "
rm /root/hadoop-2.6.0/etc/hadoop/masters > /dev/null 2>&1
sed '/master/d' /etc/hosts > temp
echo '$MASTER' " master" >> temp
echo '$SLAVE' 'euca-'`echo $SLAVE | sed 's/\./-/g'`'.eucalyptus.internal' >> temp
cp temp /etc/hosts
rm -r /vol-01/hadoop > /dev/null 2>&1
echo '$SLAVE' 'euca-'`echo $SLAVE | sed 's/\./-/g'`'.eucalyptus.internal'
"