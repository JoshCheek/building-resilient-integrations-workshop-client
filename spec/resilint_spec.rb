require 'resilint'
require 'webmock/rspec'

RSpec.describe 'Resilint' do
  let(:base_url) { 'http://localhost:1234/test-base-url' }
  def client_for(**options)
    options.key?(:base_url)  or options[:base_url]  = base_url
    options.key?(:user_name) or options[:user_name] = 'test-username'
    options.key?(:user_id)   or options[:user_id]   = 'test-user-id'
    Resilint.registered(**options)
  end

  it 'uses the provided base_url' do
    r = client_for(base_url: 'http://example.com/base-url')
    expect(r.base_url).to eq 'http://example.com/base-url'
  end

  it 'remembers the user_name it was created with' do
    r = client_for(user_name: 'JoshCheek')
    expect(r.user_name).to eq 'JoshCheek'
  end

  describe 'user_id' do
    let(:user_name)        { 'JoshCheek' }
    let(:returned_user_id) { 'returned-user-id' }

    def stub_registration!
      stub_request(:post, "#{base_url}/v1/register?userName=#{user_name}")
        .to_return(status: 200, body: "{\"user\":\"#{returned_user_id}\",\"name\":\"#{user_name}\"}")
    end

    it 'uses the provided user_id' do
      r = client_for(user_id: 'abc123')
      expect(r.user_id).to eq 'abc123'
    end

    it 'registers a user, based off the user_name, if no id was provided' do
      stub_registration!
      r = client_for(user_id: nil, user_name: user_name)
      expect(r.user_id).to eq returned_user_id
    end

    it 'calls the post_registration hook after registering' do
      stub_registration!
      id = nil
      client_for(user_id: nil, user_name: user_name, post_registration: lambda { |registered_id|
        id = registered_id
      })
      expect(id).to eq returned_user_id
    end
  end


  describe 'dig for gold' do
    # => {"bucketId"=>"499728b5-c311-4c59-ac3d-132686dfa036", "gold"=>{"units"=>4}}
    # [5] pry(main)> JSON.parse(RestClient.post 'http://resilient-integration-workshop.herokuapp.com/v1/excavate', {})
  end
end
