
table client {
  id bigint [pk]

  email varchar
  password varchar

  name varchar
  surname varchar
  lastname varchar

  violations_count int
  metric_threshold int
  
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp
}

table manager {
  id bigint [pk]

  email varchar
  password varchar

  name varchar
  surname varchar
  lastname varchar

}

enum worker_role {
  corrections_officer
  surveillance_officer
}

table worker {
  id bigint [pk]

  email varchar
  password varchar

  name varchar
  surname varchar
  lastname varchar

  role worker_role
}

table file {
  path varchar [pk, note: "путь на серваке куда сохранен файл"]
  name varchar
  uploader_id bigint [not null]
}

table device {
  device_id bigint [pk]
  assigned_client_id bigint [null]
}

table metric {
  id bigint [pk]
  device_id bigint [not null]
  value int
  timestamp timestamp
}

enum punishment_task_status {
  new
  in_progress
  done
}

enum punishment_type {
  physical
  electrical
}

table punishment_task {
  id bigint [pk]
  status punishment_task_status
  
  client_id bigint [not null]
  executioner_id bigint [not null]

  type punishment_types

  creator_id bigint [null]

  triggered_metric_id bigint [null]

  created_at timestamp
  done_at timestamp
}

enum notification_status {
  read
  unread
}

enum notification_type {
  CONTRACT_CREATION
  CONTRACT_STATUS_UPDATE
  PUNISHMENT_TASK_CREATION
  
}

table notification {
  id bigint [pk]
  text varchar
  type notification_type 
  related_entity_id bigint
  status notification_status
  client_id bigint [null]
  worker_id bigint [null]
  manager_id bigint [null]
}

enum weekday {
  monday
  tuesday
  wednesday
  thursday
  friday
  saturday
  sunday
}

table time_interval [note: "из временных интервалов складывается недельное расписание"] {

  id bigint [pk]

  worker_id bigint [null]
  manager_id bigint [null]

  begin time
  end time

  weekday weekday

}

enum contract_status {
  created
  signed
}

table contract {
  id bigint [pk]
  status contract_status

  filepath varchar

  client_id bigint [not null]

  signer_id bigint [null]

  created_at timestamp
  signed_at timestamp
}


Ref: "device"."device_id" < "metric"."device_id"


Ref: "client"."id" < "contract"."client_id"

Ref: "manager"."id" < "contract"."signer_id"

Ref: "worker"."id" < "notification"."worker_id"

Ref: "manager"."id" < "notification"."manager_id"

Ref: "worker"."id" < "punishment_task"."executioner_id"

Ref: "manager"."id" < "time_interval"."manager_id"

Ref: "worker"."id" < "time_interval"."worker_id"

Ref: "client"."id" < "notification"."client_id"

Ref: "client"."id" < "file"."uploader_id"

Ref: "client"."id" < "device"."assigned_client_id"

Ref: "client"."id" < "punishment_task"."client_id"

Ref: "metric"."id" < "punishment_task"."triggered_metric_id"

Ref: "worker"."id" < "punishment_task"."creator_id"


Ref: "file"."path" < "contract"."filepath"