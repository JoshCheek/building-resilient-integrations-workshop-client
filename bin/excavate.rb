#!/usr/bin/env ruby

$LOAD_PATH.unshift File.expand_path('../lib', __dir__)
require 'resilint'

data_file = "./data"
user_id   = File.read(data_file) if File.exist? data_file

post_registration = lambda do |user_id|
  File.write data_file, user_id
end

resilint = Resilint.registered(
  base_url:          'https://resilient-integration-workshop.herokuapp.com',
  post_registration: post_registration,
  user_name:         'JoshCheek',
  user_id:           user_id,
  timeout:           1,
)


def self.print_coloured(colour, *msgs)
  coloured_msgs = msgs.map { |msg| "#{colour}#{msg}" }
  puts coloured_msgs.join
end
def self.attempt(*msgs)
  print_coloured "\e[33m", *msgs
end
def self.error(*msgs)
  print_coloured "\e[31m", '  ', *msgs
end
def self.success(*msgs)
  print_coloured "\e[32m", '  ', *msgs
end

def self.pretty_inspect(primitive_obj)
  hsh_colour     = "\e[39m"
  sym_key_colour = "\e[96m"
  num_colour     = "\e[94m"
  str_sym_value  = "\e[93m"
  no_colour      = "\e[0m"

  case primitive_obj
  when Fixnum
    "#{num_colour}#{primitive_obj.inspect}#{no_colour}"
  when Float
    "#{num_colour}%0.2f#{no_colour}" % primitive_obj
  when String, Symbol
    "#{str_sym_value}#{primitive_obj.inspect}#{no_colour}"
  when Hash
    pairs = primitive_obj.map { |key, value|
      if key.kind_of? Symbol
        pair = "#{sym_key_colour}#{key}:#{no_colour} "
      else
        pair = "#{pretty_inspect key} #{hsh_colour}=>#{no_colour} "
      end
      "#{pair}#{pretty_inspect value}"
    }.join("#{hsh_colour},#{no_colour} ")
    "#{hsh_colour}{ #{pairs}#{hsh_colour} }\e[0m"
  else raise "Wat: #{primitive_obj.inspect}"
  end
end


start_time = Time.now
stored = 0
loop do
  attempt "Excavating"
  if found = resilint.excavate
    success "Found gold at ", pretty_inspect(found)
  else
    error "Failed to excavate, trying again"
    next
  end

  # < 1 yielded 1.4 gps
  # < 2 yielded 1.1 gps
  # < 3 yielded 0.94 gps
  if found[:value] < 1
    error "Not going to store, value of ", pretty_inspect(found[:value]), " is too low"
    next
  end

  attempt "Storing gold"
  until resilint.store found.fetch(:bucket_id)
    error "Failed to store, trying again"
  end

  stored += found[:value]
  seconds = Time.now - start_time
  rate    = stored / seconds
  stats   = { seconds: seconds, stored: stored, gold_per_sec: rate }
  success "Stored gold #{pretty_inspect stats}"
end
